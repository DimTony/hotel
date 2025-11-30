import jwt from "jsonwebtoken";
import { logger } from "@/lib/logger";

interface JWTPayload {
  unique_name: string;
  sub: string;
  Name: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string;
  AdminData: string;
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

  static extractUserRoles(payload: JWTPayload): string[] {
    const roles: string[] = [];

    try {
      const roleFromClaim =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (roleFromClaim) {
        roles.push(roleFromClaim);
      }

      if (payload.AdminData) {
        const adminData: ParsedAdminData = JSON.parse(payload.AdminData);
        if (adminData.role && !roles.includes(adminData.role)) {
          roles.push(adminData.role);
        }
      }
    } catch (error) {
      logger.error("Error extracting roles from JWT payload:", error);
    }

    return roles;
  }

  static extractUserInfo(payload: JWTPayload) {
    try {
      let adminData: ParsedAdminData | null = null;

      if (payload.AdminData) {
        adminData = JSON.parse(payload.AdminData);
      }

      return {
        id: adminData?.id || payload.sub,
        username: payload.sub,
        name: payload.Name || adminData?.name,
        email: payload.unique_name || adminData?.emailAddress,
        roles: this.extractUserRoles(payload),
        lastLogin: adminData?.lastLogin,
      };
    } catch (error) {
      logger.error("Error extracting user info from JWT:", error);
      return null;
    }
  }
}
