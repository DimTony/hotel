import { Subject, Subscription } from "rxjs";
import Redis from "ioredis";

interface SessionInvalidationEvent {
  sessionId: string;
  timestamp: number;
}

class SessionManager {
  private invalidationSubject: Subject<SessionInvalidationEvent>;
  private redis: Redis | null;
  private invalidatedSessions: Set<string>;

  constructor() {
    this.invalidationSubject = new Subject<SessionInvalidationEvent>();

    this.redis = process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL)
      : null;

    this.invalidatedSessions = new Set<string>();
  }

  async invalidateSession(sessionId: string): Promise<void> {
    if (!sessionId) return;

    const timestamp = Date.now();

    if (this.redis) {
      await this.redis.set(
        `invalidated:${sessionId}`,
        timestamp.toString(),
        "EX",
        30 * 24 * 60 * 60
      );
    } else {
      this.invalidatedSessions.add(sessionId);
    }

    this.invalidationSubject.next({ sessionId, timestamp });
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    if (!sessionId) return false;

    if (this.redis) {
      const result = await this.redis.get(`invalidated:${sessionId}`);
      return result === null;
    } else {
      return !this.invalidatedSessions.has(sessionId);
    }
  }

  onSessionInvalidated(
    callback: (event: SessionInvalidationEvent) => void
  ): Subscription {
    return this.invalidationSubject.subscribe(callback);
  }

  async forceLogoutUser(userId: string): Promise<void> {
    if (!userId) return;

    if (this.redis) {
      await this.redis.set(
        `user-invalidated:${userId}`,
        Date.now().toString(),
        "EX",
        30 * 24 * 60 * 60
      );
    }
  }

  async isUserValid(userId: string): Promise<boolean> {
    if (!userId) return false;

    if (this.redis) {
      const result = await this.redis.get(`user-invalidated:${userId}`);
      return result === null;
    }
    return true;
  }
}

export const sessionManager = new SessionManager();
