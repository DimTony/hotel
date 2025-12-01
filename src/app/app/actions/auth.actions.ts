"use server";

import { ApiService } from "../api/_services/api.v2.service";

interface ValidateCredentialsInput {
  username: string;
  password: string;
}

interface ValidateCredentialsResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export async function validateCredentials(
  input: ValidateCredentialsInput
): Promise<ValidateCredentialsResponse> {
  try {
    const apiService = new ApiService();

    const payload = {
      email: input.username,
      password: input.password,
    };

    const response = await apiService.validateUser(payload);

    // console.log("RESPONSEAPI", response)

    return response;
  } catch (error: any) {
    console.error("[Entrust Login Error]", error);

    throw new Error(
      error.message || "Failed to validate credentials. Please try again."
    );
  }
}
