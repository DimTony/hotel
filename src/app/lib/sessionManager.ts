/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, lt, sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  userId: text("user_id").notNull(),
  loginTime: integer("login_time", { mode: "timestamp" }).notNull(),
  lastActivity: integer("last_activity", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isBlacklisted: integer("is_blacklisted", { mode: "boolean" })
    .notNull()
    .default(false),
});

// types/session.ts
export interface UserSession {
  userId: string;
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isBlacklisted?: boolean;
}

export interface SessionValidationResult {
  isValid: boolean;
  reason?: "no_session" | "session_expired" | "concurrent_session_exists";
  existingSession?: UserSession;
}

export class SessionManager {
  private db;
  private client;
  private sessionTimeout: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(sessionTimeoutSeconds: number) {
    this.sessionTimeout = sessionTimeoutSeconds * 1000; // Convert to milliseconds

    // Initialize database connection
    // Use DATABASE_URL environment variable for shared database support
    // Falls back to local file for backwards compatibility
    this.client = createClient({
      url: process.env.DATABASE_URL || "file:session.db",
    });

    this.db = drizzle(this.client, { schema: { sessions } });

    // Initialize database tables and start cleanup
    this.initializeDatabase();
    this.startCleanupInterval();
  }

  private async initializeDatabase(): Promise<void> {
    // Create table if it doesn't exist (handled by migration or schema)
    try {
      await this.db.select().from(sessions).limit(1);
    } catch (error) {
      console.error("Database initialization error:", error);

      console.warn("⏳ Running migrations...");

      const start = Date.now();
      // If table doesn't exist, create it using raw SQL
      try {
        await this.client.execute(`
          CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            login_time INTEGER NOT NULL,
            last_activity INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            is_blacklisted INTEGER NOT NULL DEFAULT 0
          )
        `);
        console.warn("Sessions table created successfully");
      } catch (createError) {
        console.error("Error creating sessions table:", createError);
      }

      const end = Date.now();

      console.log("✅ Migrations completed in", end - start, "ms");
    }
  }

  /**
   * Get all active sessions
   */
  public async getSessions(): Promise<Map<string, UserSession>> {
    try {
      const allSessions = await this.db.select().from(sessions);
      const sessionMap = new Map<string, UserSession>();

      allSessions.forEach((session) => {
        sessionMap.set(session.sessionId, {
          userId: session.userId,
          sessionId: session.sessionId,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          isBlacklisted: session.isBlacklisted || false,
        });
      });

      return sessionMap;
    } catch (error) {
      console.error("Error getting sessions:", error);
      return new Map();
    }
  }

  /**
   * Get sessions for a specific user
   */
  public async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const userSessions = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      return userSessions.map((session) => ({
        userId: session.userId,
        sessionId: session.sessionId,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isBlacklisted: session.isBlacklisted || false,
      }));
    } catch (error) {
      console.error("Error getting user sessions:", error);
      return [];
    }
  }

  /**
   * Get valid sessions for a specific user (not expired and not blacklisted)
   */
  public async getValidUserSessions(userId: string): Promise<UserSession[]> {
    const timestamp = new Date().toISOString();
    try {
      const now = new Date();
      const userSessions = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      console.log(
        `[${timestamp}] [SESSION_MGR] [getValidUserSessions] Found ${userSessions.length} total sessions for userId: ${userId}`
      );

      const validSessions: UserSession[] = [];
      let expiredCount = 0;
      let blacklistedCount = 0;

      for (const session of userSessions) {
        // Check if session is expired
        if (now > session.expiresAt) {
          // Clean up expired session
          console.log(
            `[${timestamp}] [SESSION_MGR] [getValidUserSessions] Removing expired session: ${session.sessionId}`
          );
          await this.removeSession(session.sessionId);
          expiredCount++;
          continue;
        }

        // Check if session is blacklisted
        if (session.isBlacklisted) {
          console.log(
            `[${timestamp}] [SESSION_MGR] [getValidUserSessions] Skipping blacklisted session: ${session.sessionId}`
          );
          blacklistedCount++;
          continue;
        }

        // Session is valid - add to results
        validSessions.push({
          userId: session.userId,
          sessionId: session.sessionId,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          isBlacklisted: session.isBlacklisted || false,
        });
      }

      console.log(
        `[${timestamp}] [SESSION_MGR] [getValidUserSessions] Result for userId: ${userId} - Valid: ${validSessions.length}, Expired: ${expiredCount}, Blacklisted: ${blacklistedCount}`
      );

      return validSessions;
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [getValidUserSessions] ❌ Error getting valid user sessions for ${userId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Validate if a user can login (check for concurrent sessions)
   * Blacklists existing active sessions and allows new login
   */
  public async validateLoginAttempt(
    userId: string
  ): Promise<SessionValidationResult> {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] Starting for userId: ${userId}`
    );

    try {
      const now = new Date();
      const userSessions = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      console.log(
        `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] Found ${userSessions.length} existing sessions for userId: ${userId}`
      );

      let expiredCount = 0;
      let blacklistedCount = 0;

      for (const session of userSessions) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] Checking session: ${session.sessionId}, expiresAt: ${session.expiresAt}, blacklisted: ${session.isBlacklisted}`
        );

        // Check if session is expired
        if (now > session.expiresAt) {
          // Clean up expired session
          console.log(
            `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] Removing expired session: ${session.sessionId}`
          );
          await this.removeSession(session.sessionId);
          expiredCount++;
        } else {
          // Active session exists - blacklist it instead of preventing login
          console.log(
            `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] ⚠️ BLACKLISTING active session: ${session.sessionId}`
          );
          await this.blacklistSession(session.sessionId);
          blacklistedCount++;
        }
      }

      console.log(
        `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] ✅ Completed - Expired: ${expiredCount}, Blacklisted: ${blacklistedCount}`
      );

      return {
        isValid: true,
        reason: userSessions.length > 0 ? "session_expired" : "no_session",
      };
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [validateLoginAttempt] ❌ Error validating login attempt:`,
        error
      );
      return {
        isValid: true,
        reason: "no_session",
      };
    }
  }

  /**
   * Create a new session for a user
   */
  public async createSession(
    userId: string,
    sessionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const timestamp = new Date().toISOString();
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.sessionTimeout);

      const newSession: UserSession = {
        userId,
        sessionId,
        loginTime: now,
        lastActivity: now,
        expiresAt,
        ipAddress,
        userAgent,
        isBlacklisted: false,
      };

      await this.db.insert(sessions).values({
        sessionId,
        userId,
        loginTime: now,
        lastActivity: now,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        isBlacklisted: false,
      });

      console.log(
        `[${timestamp}] [SESSION_MGR] [createSession] ✅ New session created - SessionId: ${sessionId}, UserId: ${userId}, IP: ${
          ipAddress || "unknown"
        }, ExpiresAt: ${expiresAt}`
      );

      return newSession;
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [createSession] ❌ Error creating session for userId: ${userId}, sessionId: ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update session activity (extend expiration)
   */
  public async updateSessionActivity(sessionId: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.sessionTimeout);

      // Get session info before update for logging
      const sessionBefore = await this.getSession(sessionId);

      const result = await this.db
        .update(sessions)
        .set({
          lastActivity: now,
          expiresAt: expiresAt,
        })
        .where(eq(sessions.sessionId, sessionId))
        .returning();

      const success = result.length > 0;

      if (success && sessionBefore) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [updateSessionActivity] Session activity updated - SessionId: ${sessionId}, UserId: ${sessionBefore.userId}, New expiresAt: ${expiresAt}, Blacklisted: ${sessionBefore.isBlacklisted}`
        );
      } else if (!success) {
        console.warn(
          `[${timestamp}] [SESSION_MGR] [updateSessionActivity] Failed to update activity (session not found): ${sessionId}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [updateSessionActivity] ❌ Error updating session activity for ${sessionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Remove a specific session
   */
  public async removeSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error removing session:", error);
      return false;
    }
  }

  /**
   * Remove all sessions for a specific user
   */
  public async removeUserSessions(userId: string): Promise<number> {
    try {
      const result = await this.db
        .delete(sessions)
        .where(eq(sessions.userId, userId))
        .returning();

      return result.length;
    } catch (error) {
      console.error("Error removing user sessions:", error);
      return 0;
    }
  }

  /**
   * Blacklist a specific session
   */
  public async blacklistSession(sessionId: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    try {
      // Get session info before blacklisting for logging
      const sessionBefore = await this.getSession(sessionId);

      const result = await this.db
        .update(sessions)
        .set({
          isBlacklisted: true,
        })
        .where(eq(sessions.sessionId, sessionId))
        .returning();

      const success = result.length > 0;

      if (success) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [blacklistSession] ⚠️ Session BLACKLISTED: ${sessionId}, userId: ${
            sessionBefore?.userId || "unknown"
          }`
        );
      } else {
        console.warn(
          `[${timestamp}] [SESSION_MGR] [blacklistSession] Failed to blacklist session (not found): ${sessionId}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [blacklistSession] ❌ Error blacklisting session ${sessionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get session by session ID
   */
  public async getSession(sessionId: string): Promise<UserSession | undefined> {
    try {
      const sessionData = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionId, sessionId))
        .limit(1);

      if (sessionData.length === 0) {
        return undefined;
      }

      const session = sessionData[0];
      return {
        userId: session.userId,
        sessionId: session.sessionId,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        isBlacklisted: session.isBlacklisted || false,
      };
    } catch (error) {
      console.error("Error getting session:", error);
      return undefined;
    }
  }

  /**
   * Check if a session exists and is valid
   */
  public async isSessionValid(sessionId: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [isSessionValid] Session NOT FOUND: ${sessionId}`
        );
        return false;
      }

      // Check if session is blacklisted
      if (session.isBlacklisted) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [isSessionValid] ❌ Session BLACKLISTED: ${sessionId}, userId: ${session.userId}`
        );
        return false;
      }

      const now = new Date();
      if (now > session.expiresAt) {
        console.log(
          `[${timestamp}] [SESSION_MGR] [isSessionValid] ❌ Session EXPIRED: ${sessionId}, userId: ${session.userId}, expiredAt: ${session.expiresAt}`
        );
        await this.removeSession(sessionId);
        return false;
      }

      console.log(
        `[${timestamp}] [SESSION_MGR] [isSessionValid] ✅ Session VALID: ${sessionId}, userId: ${session.userId}, expiresAt: ${session.expiresAt}`
      );
      return true;
    } catch (error) {
      console.error(
        `[${timestamp}] [SESSION_MGR] [isSessionValid] ❌ Error checking session validity for ${sessionId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      await this.db.delete(sessions).where(lt(sessions.expiresAt, now));
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
    }
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 7 * 60 * 1000); // Run every 7 minutes
  }

  /**
   * Cleanup resources when shutting down
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Legacy methods for backward compatibility
  /**
   * Mark a session as invalid (for backward compatibility)
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.removeSession(sessionId);
  }

  /**
   * Check if a user has been force-logged out (for backward compatibility)
   */
  async isUserValid(userId: string): Promise<boolean> {
    // Check if user has any valid (non-blacklisted) sessions
    const validSessions = await this.getValidUserSessions(userId);
    return validSessions.length > 0;
  }
}

// Create singleton instance
export const sessionManager = new SessionManager(
  +(process.env.NEXT_SESSION_DURATION || process.env.SESSION_DURATION || "900") // 15 mins default
);

// Graceful shutdown
function addProcessListener(event: NodeJS.Signals, listener: () => void) {
  const listeners = process.listeners(event);
  if (listeners.length < 2) {
    process.on(event, listener);
  } else {
    console.warn(
      `Maximum listeners (${listeners.length}) already attached for event: ${event}`
    );
  }
}

addProcessListener("SIGINT", () => {
  sessionManager.destroy();
  process.exit(0);
});

addProcessListener("SIGTERM", () => {
  sessionManager.destroy();
  process.exit(0);
});
