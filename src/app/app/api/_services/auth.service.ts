import { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureAD from "next-auth/providers/azure-ad";
import { UserRoles } from "@/lib/types";
import { sessionManager } from "./session.service";
import { ApiService } from "./api.v2.service";
import { logger } from "@/lib/logger";
import { JWTService } from "./token.service";

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
    userId?: string;
    sessionId?: string;
    browserFingerprint?: string;
    //@ts-ignore
    user: {
      id: string;
      nt: string;
      name: string;
      username: string;
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

const TestProvider = CredentialsProvider({
  id: "mock-credentials",
  name: "Test credentials",
  credentials: {
    username: { label: "Username", type: "text" },
    code: { label: "Code", type: "text" },
    token: { label: "Token", type: "text" },
  },
  //@ts-ignore
  async authorize(credentials) {
    if (!credentials?.username || !credentials?.code || !credentials?.token) {
      return null;
    }

    const apiService = new ApiService();

    const payload = {
      username: credentials.username,
      code: credentials.code,
      token: credentials.token,
    };

    try {
      const response = await apiService.authenticateEntrust(payload);

      if (response.httpStatusCode === 200 && !response.data) {
        throw new Error(response.message || "Invalid Token Request");
      }

      if (!response?.data?.auth?.accessToken) {
        logger.error(`Authentication failed for user: ${credentials.username}`);
        throw new Error(response.message || "Unable to verify token");
      }

      const jwtPayload = JWTService.verifyToken(response.data.auth.accessToken);

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
        const hasAuthorizedRole = userInfo.roles.some((role: any) =>
          authorizedRoles.includes(role)
        );

        if (!hasAuthorizedRole) {
          throw new Error("Unauthorized User, Contact your administrator!");
        }
      }

      rateLimitStore.delete(`auth:${credentials.username}`);

      return {
        id: userInfo.id.toString(),
        nt: userInfo.username,
        username: userInfo.username,
        name: userInfo.name,
        email: userInfo.email,
        image: null,
        role: userInfo.roles,
        accessToken: response.data.auth.accessToken,
      };
    } catch (error: any) {
      logger.error("Entrust authentication failed:", error);
      return null;
    }
  },
});

const MiddlewareProvider = CredentialsProvider({
  id: "middleware-credentials",
  name: "Access bank",
  credentials: {
    username: { label: "Username", type: "text" },
    code: { label: "Code", type: "text" },
    token: { label: "Token", type: "text" },
  },
  //@ts-ignore
  async authorize(credentials) {
    try {
      // 🔍 LOG 1: Check what credentials are received
      console.log("🔐 [MiddlewareProvider] Starting authorization...");
      console.log("📥 [MiddlewareProvider] Credentials received:", {
        username: credentials?.username,
        hasCode: !!credentials?.code,
        hasToken: !!credentials?.token,
        codeLength: credentials?.code?.length,
        tokenLength: credentials?.token?.length,
      });

      if (!credentials?.username || !credentials?.code || !credentials?.token) {
        console.error("❌ [MiddlewareProvider] Missing required credentials");
        throw new Error("Missing required credentials");
      }

      // Add rate limiting check - 10 attempts per 15 minutes
      if (!checkRateLimit(credentials.username, 10, 900000)) {
        logger.error(`Rate limit exceeded for user: ${credentials.username}`);
        console.error(
          "⏱️ [MiddlewareProvider] Rate limit exceeded for:",
          credentials.username
        );
        throw new Error(
          "Too many authentication attempts. Please try again later."
        );
      }

      const apiService = new ApiService();

      const payload = {
        username: credentials.username,
        code: credentials.code,
        token: credentials.token,
      };

      // 🔍 LOG 2: About to call API
      console.log("🌐 [MiddlewareProvider] Calling authenticateEntrust API...");

      const response = await apiService.authenticateEntrust(payload);

      // 🔍 LOG 3: API response received
      console.log("📡 [MiddlewareProvider] API Response:", {
        httpStatusCode: response.httpStatusCode,
        hasData: !!response.data,
        message: response.message,
        hasAccessToken: !!response?.data?.auth?.accessToken,
      });

      if (response.httpStatusCode === 200 && !response.data) {
        throw new Error(response.message || "Invalid Token Request");
      }

      if (!response?.data.auth?.accessToken) {
        logger.error(`Authentication failed for user: ${credentials.username}`);
        console.error("❌ [MiddlewareProvider] No access token in response:", {
          username: credentials.username,
          message: response.message,
          responseData: response.data,
        });
        throw new Error(response.message || "Unable to verify token");
      }

      // 🔍 LOG 4: Verifying JWT
      console.log("🔑 [MiddlewareProvider] Verifying JWT token...");

      const jwtPayload = JWTService.verifyToken(response.data.auth.accessToken);

      if (!jwtPayload) {
        logger.error("Invalid or expired JWT token");
        console.error("❌ [MiddlewareProvider] JWT verification failed");
        throw new Error("Invalid authentication token");
      }

      // 🔍 LOG 5: Extracting user info
      console.log("👤 [MiddlewareProvider] Extracting user info from JWT...");

      const userInfo = JWTService.extractUserInfo(jwtPayload);

      if (!userInfo) {
        logger.error("Failed to extract user information from JWT");
        console.error(
          "❌ [MiddlewareProvider] Failed to extract user info from JWT"
        );
        throw new Error("Invalid user data in token");
      }

      // 🔍 LOG 6: User info extracted
      console.log("✅ [MiddlewareProvider] User info extracted:", {
        id: userInfo.id,
        username: userInfo.username,
        name: userInfo.name,
        email: userInfo.email,
        roles: userInfo.roles,
      });

      const authorizedRoles =
        process.env.AUTHORIZED_ROLES?.split(",").map((role) => role.trim()) ||
        [];

      if (authorizedRoles.length > 0) {
        console.log("🔒 [MiddlewareProvider] Checking role authorization...", {
          userRoles: userInfo.roles,
          authorizedRoles,
        });

        const hasAuthorizedRole = userInfo.roles.some((role: any) =>
          authorizedRoles.includes(role)
        );

        if (!hasAuthorizedRole) {
          console.error(
            "❌ [MiddlewareProvider] User does not have authorized role"
          );
          throw new Error("Unauthorized User, Contact your administrator!");
        }
      }

      // Clear rate limit on successful authentication
      rateLimitStore.delete(`auth:${credentials.username}`);

      // 🔍 LOG 7: Success!
      console.log(
        "✅ [MiddlewareProvider] Authorization successful for:",
        credentials.username
      );

      return {
        id: userInfo.id.toString(),
        nt: userInfo.username,
        username: userInfo.username,
        name: userInfo.name,
        email: userInfo.email,
        image: null,
        role: userInfo.roles,
        accessToken: response.data.auth.accessToken,
      };
    } catch (error) {
      // 🔍 LOG 8: Error details
      console.error("❌ [MiddlewareProvider] Authorization error:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        username: credentials?.username,
      });

      logger.error("MiddlewareProvider authorization error:", error);
      throw error; // Re-throw to let NextAuth handle it
    }
  },
});

export const authOptions: AuthOptions = {
  providers: [TestProvider, MiddlewareProvider, AzureADProvider],
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
        return `/dashboard`;
      }

      if (url === `${baseUrl}/`) {
        return url;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // console.log("Redirecting from callback");
      return `/dashboard`;
    },

    async jwt({ token, account, user, profile, trigger }) {
      if (user) {
        // console.log("User in Token:", user);

        token.sessionId = crypto.randomUUID();
        token.userId = user.id;
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
      }

      if (account) {
        if (account.provider === "middleware-credentials") {
          // Copy user data to token
          token.nt = (user as any).nt;
          token.name = (user as any).name;
          token.email = (user as any).email;
          token.role = (user as any).role;
          token.accessToken = (user as any).accessToken;
        }

        if (account.provider === "azure-ad") {
          // Extract NT from the Azure AD profile username (email)
          const ntUsername = (
            profile as Profile<typeof profile>
          )?.preferred_username?.split("@")[0];

          token.nt = ntUsername;
        }

        if (
          token.expiresAt &&
          typeof token.expiresAt === "number" &&
          Date.now() > token.expiresAt
        ) {
          return Promise.reject({
            error: "Token expired",
          });
        }

        if (account.provider === "mock-credentials") {
          // console.log("user in JWT:", user);

          token.nt = (user as any).nt;
          token.name = (user as any).name;
          token.email = (user as any).email;
          token.role = (user as any).role;
          token.accessToken = (user as any).accessToken;
        }
      }
      if (token.picture) {
        delete token.picture; // Remove the base64 image
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.userId = token.userId as string;
        session.sessionId = token.sessionId as string;

        const isValid = await sessionManager.isSessionValid(
          (token as any).sessionId
        );
        const isUserValid = await sessionManager.isUserValid(
          (token as any).userId
        );

        if (!isValid || !isUserValid) {
          throw new Error("Session has been invalidated");
        }
        // console.log('Token in Session:', token)

        session.accessToken = token.accessToken as string;
        session.user = {
          ...session.user,
          nt: token.nt as string,
          email: token.email as string,
          name: token.name as string,
          image: "",
          role: token.role as UserRoles[],
        };
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
