import { NextRequest, NextResponse } from "next/server";
import { ApiService } from "../../_services/api.v2.service";
import { getServerSession } from "next-auth";
import { authOptions } from "../../_services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {

      return NextResponse.json(
        {
          success: false,
          message: "No active session found",
        },
        { status: 401 }
      );
    }
    
    const apiService = new ApiService(session.accessToken);

    const logoutResult = await apiService.logout();

    return NextResponse.json(
      {
        success: true,
        message: "Logout completed successfully",
        data: {
          logoutResponse: logoutResult,
          tokenCleared: !apiService.isAuthenticated(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
        error: {
          name: error.name,
          message: error.message,
          details: error.response?.data || error.toJSON?.() || error.toString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
