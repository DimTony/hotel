import jwt from "jsonwebtoken";
import { logger } from "@/lib/logger";

interface JWTPayload {
  // unique_name: string;
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
  jti: string;
  exp: number;
  iss: string;
  aud: string;
}

interface ParsedAdminData {
  id: number;
  username: string;
  emailAddress: string;
  lastLogin: string;
  role: string;
  name: string;
}

export class JWTService {
  private static readonly JWT_SECRET = process.env.NEXT_API_EXTERNAL_JWT_SECRET;

  static verifyToken(token: string): JWTPayload | null {
    try {
      if (!this.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        logger.warn("Token has expired");
        return null;
      }

      return decoded;
    } catch (error) {
      logger.error("JWT verification failed:", error);
      return null;
    }
  }

  static isTokenExpired(payload: JWTPayload): boolean {
    if (!payload.exp) return true;

    const expirationTIme = payload.exp * 1000;
    const currentTime = Date.now();
    const buffer = 30 * 1000;

    return currentTime >= expirationTIme - buffer;
  }

  static extractUserRoles(payload: JWTPayload): string[] {
    const roles: string[] = [];

    try {
      const roleFromClaim =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (roleFromClaim) {
        roles.push(roleFromClaim);
      }
    } catch (error) {
      logger.error("Error extracting roles from JWT payload:", error);
    }

    return roles;
  }

  static extractUserInfo(payload: JWTPayload) {
    try {
      const role = this.extractUserRoles(payload);
      const isExpired = this.isTokenExpired(payload);

      const firstName = payload.given_name || "";
      const lastName = payload.family_name || "";
      const fullName =
        `${firstName} ${lastName}`.trim() || payload.given_name || "";

      return {
        id: payload.sub,
        email: payload.email,
        firstName,
        lastName,
        fullName,
        role,
        isTokenExpired: isExpired,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      };
    } catch (error) {
      logger.error("Error extracting user info from JWT:", error);
      return null;
    }
  }
}
