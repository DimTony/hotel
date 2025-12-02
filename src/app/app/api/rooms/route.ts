import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../_services/auth.service";
import { ApiService } from "../_services/api.v2.service";
import { sessionManager } from "@/lib/sessionManager";

// Validate session function (similar to /infopool/route.ts)
async function validateSession(request: NextRequest, requestId: string) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);

    // Basic session validation
    if (!session || !session.user || !session.user.email) {
      console.error(`[${requestId}] No valid session or user data found`);
      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Unauthorized - Authentication required" },
          { status: 401 }
        ),
      };
    }

    // Generate browser fingerprint for this request
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLang = request.headers.get("accept-language") || "";
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    const fingerprintData = `${userAgent}|${acceptLang}|${ip.split(",")[0]}`;
    const currentFingerprint = crypto
      .createHash("sha256")
      .update(fingerprintData)
      .digest("hex");

    // Check if session has been invalidated in the session manager
    if (
      session.sessionId &&
      !(await sessionManager.isSessionValid(session.sessionId))
    ) {
      console.error(
        `[${requestId}] Session ${session.sessionId} has been invalidated`
      );
      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Session expired", code: "SESSION_EXPIRED" },
          { status: 401 }
        ),
      };
    }

    // Check for user-level invalidation (force logout)
    if (session.userId && !(await sessionManager.isUserValid(session.userId))) {
      console.error(
        `[${requestId}] User ${session.userId} has been force-logged out`
      );

      // Also invalidate this specific session for completeness
      if (session.sessionId) {
        await sessionManager.invalidateSession(session.sessionId);
      }

      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Account has been logged out", code: "ACCOUNT_LOGGED_OUT" },
          { status: 401 }
        ),
      };
    }

    // Compare browser fingerprints to detect session hijacking
    if (
      session.browserFingerprint &&
      session.browserFingerprint !== currentFingerprint
    ) {
      console.warn(
        `[${requestId}] Browser fingerprint mismatch for session ${session.sessionId}!`
      );
      console.warn(`Expected: ${session.browserFingerprint}`);
      console.warn(`Received: ${currentFingerprint}`);

      // Potential session hijacking - invalidate the session
      if (session.sessionId) {
        await sessionManager.invalidateSession(session.sessionId);
      }

      return {
        isValid: false,
        response: NextResponse.json(
          { error: "Security violation detected", code: "SECURITY_VIOLATION" },
          { status: 403 }
        ),
      };
    }

    // If we get here, the session is valid
    return {
      isValid: true,
      session,
    };
  } catch (error) {
    console.error(`[${requestId}] Session validation error:`, error);
    return {
      isValid: false,
      response: NextResponse.json(
        { error: "Authentication error", code: "AUTH_ERROR" },
        { status: 500 }
      ),
    };
  }
}
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  const validation = await validateSession(request, requestId);
  if (!validation.isValid) {
    return validation.response;
  }

  try {
    const body = await request.json();

    // console.log("REFERENCE LETTER API request body:", body);
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    const apiService = await ApiService.createWithSession();

    let response;
    switch (action) {
      case "fetchAllRooms":
        response = await apiService.fetchAllRooms(data);
        break;
      case "createNewRoom":
        response = await apiService.createNewUser(data);
        break;
      case "updateRoom":
        response = await apiService.updateUser(data);
        break;
      case "deleteRoom":
        response = await apiService.deleteUser(data);
        break;
      //   case "initiateLetterRequest":
      //     response = await ServerApiService.initiateLetterRequest(data);
      //     break;
      //   case "submitNewLetterRequest":
      //     response = await ServerApiService.submitNewLetterRequest(data);
      //     break;
      //   case "getLetterRequestById":
      //     response = await ServerApiService.getLetterRequestById(data);
      //     break;
      //   case "approveLetterRequest":
      //     response = await ServerApiService.approveLetterRequest(data);
      //     break;
      //   case "rejectLetterRequest":
      //     response = await ServerApiService.rejectLetterRequest(data);
      //     break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message || "An error occured",
        requestId,
      },
      { status: 500 }
    );
  }
}
