import { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureAD from "next-auth/providers/azure-ad";
import { UserRoles } from "@/lib/types";
// import { sessionManager } from "./session.service";
import { ApiService } from "./api.v2.service";
import { logger } from "@/lib/logger";
import { JWTService } from "./token.service";
import { sessionManager } from "@/lib/sessionManager";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  identifier: string,
  maxAttempts: number = 10,
  windowMs: number = 900000
): boolean {
  const now = Date.now();
  const key = `auth:${identifier}`;
  const current = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxAttempts) {
    return false;
  }

  current.count++;
  return true;
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    expiresAt?: string;
    isTokenExpired?: boolean;
    userId?: string;
    sessionId?: string;
    browserFingerprint?: string;
    //@ts-ignore
    user: {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      role: UserRoles[];
    } & DefaultSession["user"];
  }
}

interface _Profile {
  preferred_username?: string;
  name?: string;
}

type Profile<T> = _Profile & T;

const AzureADProvider = AzureAD({
  clientId: process.env.AZURE_AD_CLIENT_ID as string,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  authorization: {
    params: {
      // redirect_uri: "http://localhost:3000/api/auth/callback/azure-ad",
      // prompt: "login",
      scope: "openid profile email",
    },
  },
});

const AuthProvider = CredentialsProvider({
  id: "auth-credentials",
  name: "Auth credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "text" },
  },
  //@ts-ignore
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    const apiService = new ApiService();

    const payload = {
      email: credentials.email,
      password: credentials.password,
    };

    try {
      const response = await apiService.validateUser(payload);

      // console.log("SERIVCE:", response);
      if (response.success && !response.user) {
        throw new Error(response.message || "Invalid Token Request");
      }

      if (!response?.accessToken) {
        logger.error(`Authentication failed for user: ${credentials.email}`);
        throw new Error(response.message || "Unable to verify token");
      }

      const jwtPayload = JWTService.verifyToken(response.accessToken);

      // console.log("SERIVCE:", jwtPayload);

      if (!jwtPayload) {
        logger.error("Invalid or expired JWT token");
        throw new Error("Invalid authentication token");
      }

      const userInfo = JWTService.extractUserInfo(jwtPayload);

      if (!userInfo) {
        logger.error("Failed to extract user information from JWT");
        throw new Error("Invalid user data in token");
      }

      const authorizedRoles =
        process.env.AUTHORIZED_ROLES?.split(",").map((role) => role.trim()) ||
        [];

      if (authorizedRoles.length > 0) {
        const hasAuthorizedRole = userInfo.role.some((role: any) =>
          authorizedRoles.includes(role)
        );

        if (!hasAuthorizedRole) {
          throw new Error("Unauthorized User, Contact your administrator!");
        }
      }

      rateLimitStore.delete(`auth:${credentials.email}`);

      return {
        id: userInfo.id.toString(),
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        fullName: userInfo.fullName,
        role: userInfo.role,
        isTokenExpired: userInfo.isTokenExpired,
        expiresAt: userInfo.expiresAt,
        accessToken: response.accessToken,
      };
    } catch (error: any) {
      logger.error("Entrust authentication failed:", error);
      return null;
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [AuthProvider, AzureADProvider],
  debug: true, // Enable debug messages
  logger: {
    error: (code, metadata) => {
      console.error(code, metadata);
    },
    warn: (code) => {
      console.warn(code);
    },
    debug: (code, metadata) => {
      console.log(code, metadata);
    },
  },
  // trustHost: true,
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.includes("error=OAuthCallback")) {
        // console.log("Handling OAuth callback error, redirecting to signin page");
        return `${baseUrl}/`;
      }

      if (url.includes("/api/auth/callback/azure-ad")) {
        // console.log("Redirecting from Azure AD to application page");
        // return `${baseUrl}/atm-load-unload`;
        return `/`;
      }

      if (url === `${baseUrl}/`) {
        return url;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // console.log("Redirecting from callback");
      return `/`;
    },
    async signIn({ account, profile, user }) {
      // For other providers, also validate login attempt
      if (user?.id) {
        await sessionManager.validateLoginAttempt(user.id);
      }

      return true;
    },
    async jwt({ token, account, user, profile, trigger }) {
      if (user) {
        // console.log("User in Token:", user);
        const existingSessionId = (user as any).sessionId;
        const isParentSession = account?.provider === "parent-session";

        if (existingSessionId) {
          // Use the existing sessionId from parent app
          token.sessionId = existingSessionId;
          token.userId = (user as any).userId || user.id;
        } else {
          // Generate new sessionId for new logins
          token.sessionId = crypto.randomUUID();
          token.userId = user.id;
        }

        if (!isParentSession) {
          try {
            const sessionId = token.sessionId as string;
            const userId = token.userId as string;

            // Check if session already exists
            const existingSession = await sessionManager.getSession(sessionId);

            if (!existingSession) {
              // Only create if it doesn't exist
              await sessionManager.createSession(userId, sessionId);
            }
          } catch (error) {
            logger.error("Error creating session in database:", error);
            // Don't fail authentication if session creation fails
          }
        }
      }

      if (trigger === "update" && token.sessionId) {
        const isValid = await sessionManager.isSessionValid(
          (token as any).sessionId
        );
        const isUserValid = await sessionManager.isUserValid(
          (token as any).userId
        );

        if (!isValid || !isUserValid) {
          // Return an invalid token to force a new sign in()
          return { ...token, error: "RefreshAccessTokenError" };
        }

        await sessionManager.updateSessionActivity((token as any).sessionId);
      }

      if (token.error) {
        return token;
      }

      if (account) {
        if (account.provider === "auth-credentials") {
          // Copy user data to token
          token.email = (user as any).email;
          token.firstName = (user as any).firstName;
          token.lastName = (user as any).lastName;
          token.fullName = (user as any).fullName;
          token.role = (user as any).role;
          token.isTokenExpired = (user as any).isTokenExpired;
          token.expiresAt = (user as any).expiresAt;
          token.accessToken = (user as any).accessToken;
        }

        if (account?.provider === "parent-session") {
          const logPrefix = `[JWT Callback - Parent Session ${new Date().toISOString()}]`;
          logger.info(`${logPrefix} Processing parent-session provider`);
          token.email = (user as any).email;
          token.firstName = (user as any).firstName;
          token.lastName = (user as any).lastName;
          token.fullName = (user as any).fullName;
          token.role = (user as any).role;
          token.isTokenExpired = (user as any).isTokenExpired;
          token.expiresAt = (user as any).expiresAt;
          token.accessToken = (user as any).accessToken;
          token.parentSessionValidated = true;

          logger.info(`${logPrefix} Token populated`, {
            userId: token.userId,
            sessionId: token.sessionId,
            userNT: token.nt,
            userRoles: token.role,
          });

          // For parent-session, ensure session exists in database
          // The sessionId and userId are already set above from the user object
          const userId = token.userId as string;
          const sessionId = token.sessionId as string;

          if (userId && sessionId) {
            try {
              logger.info(
                `${logPrefix} Validating login attempt for userId: ${userId}`
              );
              // Validate login attempt (blacklists existing sessions)
              await sessionManager.validateLoginAttempt(userId);
              logger.info(
                `${logPrefix} Login attempt validated, existing sessions blacklisted`
              );

              // Check if session exists, create if it doesn't
              const existingSession = await sessionManager.getSession(
                sessionId
              );
              logger.info(`${logPrefix} Existing session check:`, {
                sessionId,
                exists: !!existingSession,
              });

              if (!existingSession) {
                logger.info(
                  `${logPrefix} Creating new session in database: ${sessionId}`
                );
                await sessionManager.createSession(userId, sessionId);
                logger.info(
                  `${logPrefix} Session created successfully: ${sessionId}`
                );
              } else {
                logger.info(
                  `${logPrefix} Session already exists in database: ${sessionId}`
                );
              }
            } catch (error) {
              logger.error(
                `${logPrefix} Error handling parent-session:`,
                error
              );
              // Don't fail authentication if session creation fails
            }
          } else {
            logger.warn(`${logPrefix} Missing userId or sessionId`, {
              userId: !!userId,
              sessionId: !!sessionId,
            });
          }
        }

        if (
          token.expiresAt &&
          typeof token.expiresAt === "number" &&
          Date.now() > token.expiresAt
        ) {
          return { ...token, error: "TokenExpired" };
        }
      }
      if (token.picture) {
        delete token.picture; // Remove the base64 image
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        throw new Error(`Authentication error: ${token.error}`);
      }

      if (token) {
        // console.log('Token in Session:', token)

        session.userId = token.userId as string;
        session.sessionId = token.sessionId as string;
        session.accessToken = token.accessToken as string;
        session.expiresAt = token.expiresAt as string;
        session.isTokenExpired = token.isTokenExpired as boolean;
        session.user = {
          ...session.user,
          email: token.email as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          fullName: token.fullName as string,
          role: token.role as UserRoles[],
          image: "",
        };

        const sessionId = token.sessionId as string;

        if (sessionId) {
          try {
            const isValid = await sessionManager.isSessionValid(sessionId);

            if (!isValid) {
              // Get session details for better error message
              const sessionData = await sessionManager.getSession(sessionId);

              // If session doesn't exist, try to create it (for both parent-session and regular sessions)
              if (!sessionData && token.userId) {
                try {
                  await sessionManager.createSession(
                    token.userId as string,
                    sessionId
                  );
                  // Re-check validity after creation
                  const isValidAfterCreate =
                    await sessionManager.isSessionValid(sessionId);
                  if (isValidAfterCreate) {
                    // Continue with updating activity
                    await sessionManager.updateSessionActivity(sessionId);
                  } else {
                    logger.warn(
                      `Session validation failed after creation, but allowing session to continue`
                    );
                    // Don't throw error - allow session to continue
                  }
                } catch (createError) {
                  logger.error(`Failed to create session:`, createError);
                  // Don't throw error - allow session to continue
                  // The jwt callback should have created it, this is just a fallback
                }
              } else if (sessionData) {
                // Session exists but is invalid (blacklisted or expired)
                if (sessionData.isBlacklisted) {
                  const reason =
                    "Session has been blacklisted (user logged in elsewhere)";
                  throw new Error(`Session validation failed: ${reason}`);
                } else if (new Date() > sessionData.expiresAt) {
                  const reason = "Session has expired";

                  throw new Error(`Session validation failed: ${reason}`);
                }
              } else {
                // Session doesn't exist and we couldn't create it - log warning but allow to continue
                logger.warn(
                  `Session not found in database and could not be created: ${sessionId}`
                );
                // Don't throw error - allow session to continue
              }
            } else {
              // Session is valid - update activity to extend expiration

              await sessionManager.updateSessionActivity(sessionId);
            }
          } catch (validationError) {
            // Only re-throw if it's a critical error (blacklisted/expired)
            // Otherwise, log and continue
            if (
              validationError instanceof Error &&
              validationError.message.includes("Session validation failed")
            ) {
              throw validationError;
            }
            logger.error(
              ` Non-critical session validation error:`,
              validationError
            );
            // Allow session to continue for non-critical errors
          }
        } else {
          // Log warning but don't throw error - sessionId might be set in next request
          logger.warn(`Session ID not found in token, but continuing`, {
            tokenKeys: Object.keys(token),
          });
        }
      }
      // console.log('Final Session object:', session)
      return session;
    },
  },
  events: {
    signOut: async ({ token }) => {
      if (token?.sessionId) {
        // Invalidate the session
        await sessionManager.invalidateSession(token.sessionId as string);
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.NEXT_SESSION_DURATION || 900), // Default 15 mins if env var not set
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
