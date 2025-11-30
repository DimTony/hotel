"use server";

import { ApiService } from "../api/_services/api.v2.service";

interface ValidateCredentialsInput {
  username: string;
  password: string;
}

interface ValidateCredentialsResponse {
  httpStatusCode: number;
  message: string;
  errors: any[];
  data: {
    username: string;
    code: string;
  };
  totalCount: null;
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

    const response = await apiService.validateUserForEntrust(payload);

    return response;
  } catch (error: any) {
    console.error("[Entrust Login Error]", error);

    throw new Error(
      error.message || "Failed to validate credentials. Please try again."
    );
  }
}
