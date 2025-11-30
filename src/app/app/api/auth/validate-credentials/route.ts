import { NextRequest, NextResponse } from "next/server";
import { ApiService } from "../../_services/api.v2.service";

export async function POST(request: NextRequest) {
  try {
    const apiService = new ApiService();
    const body = await request.json();

    const payload = {
      email: body.username,
      password: body.password,
    };

    const response = await apiService.validateUserForEntrust(payload);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("[Entrust Login Error]", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed To Validate Credentials",
        error: {
          name: error.name,
          message: error.message,
          details: error.response?.data || error.toString(),
        },
      },
      { status: 500 }
    );
  }
}
