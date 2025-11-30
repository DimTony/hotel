import headers from "./headers.service";
import * as https from "node:https";
import Endpoints, { Backend } from "../_endpoints/api.endpoint";
import axios, { AxiosError, AxiosInstance } from "axios";
import { AuthenticationRequest, EntrustRequest } from "../_models/api.model";
import { ApiResponse } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth.service";

export function handleError(err: AxiosError) {
  if (err.response) {
    return {
      timestamp: new Date().toDateString(),
      statusCode: err.response.status,
      statusText: err.response.statusText ?? "",
      status: err.response.statusText === "success" ? "Success" : "Failed",
      message: (err.response.data as any)?.["message"],
      data: null,
      errors: [err.response.data] as any[],
    } satisfies ApiResponse<any>;
  } else if (err.request) {
    return {
      timestamp: new Date().toDateString(),
      statusCode: 400,
      status: "Failed",
      message: "Unable to initiate request",
      data: null,
      errors: [err.toJSON()],
    } satisfies ApiResponse<any>;
  } else {
    return {
      timestamp: new Date().toDateString(),
      statusCode: 500,
      status: "Failed",
      message: err.message || "Unknown error occurred",
      data: null,
      errors: [{ message: err.message }],
    } satisfies ApiResponse<any>;
  }
}

export class ApiService {
  http!: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string = "") {
    this.accessToken = accessToken;
    this.setupHttpClient();
  }

  private base = axios.create({
    baseURL: process.env.NEXT_AD_MIDDLEWARE_URL as string,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Subscription-Key": process.env.NEXT_SECRET_MIDDLEWARE_SUBKEY as string,
    },
  });

  private setupHttpClient() {
    const authHeaders = {
      ...headers,
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    this.http = axios.create({
      baseURL: Backend.base,
      headers: authHeaders,
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === "production",
      }),
    });

    this.http.interceptors.request.use((request) => {
      if (this.accessToken) {
        request.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      if (request.url?.includes("deliverables")) {
      }
      return request;
    });

    this.http.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  updateAccessToken(newToken: string) {
    this.accessToken = newToken;
    this.setupHttpClient();
  }

  clearAccessToken() {
    this.accessToken = "";
    this.setupHttpClient();
  }

  static async createWithSession(): Promise<ApiService> {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.accessToken as string) || "";
    return new ApiService(accessToken);
  }

  static createWithToken(accessToken: string): ApiService {
    return new ApiService(accessToken);
  }

  async validateUserForEntrust(data: AuthenticationRequest) {
    try {
      const response = await this.http.post(
        Endpoints.Authentication.login,
        data
      );

      return response.data as any;
    } catch (error: any) {
      console.error("[validateUserForEntrust] Authentication error:", error);
      throw handleError(error);
    }
  }

  async authenticateEntrust(data: EntrustRequest) {
    try {
      const response = await this.http.post(
        Endpoints.Authentication.validateToken,
        data
      );

      return response.data as any;
    } catch (error: any) {
      throw handleError(error);
    }
  }

  async logout() {
    try {
      const response = await this.http.post(Endpoints.Authentication.logout);

      return response.data;
    } catch (error) {
    } finally {
      this.clearAccessToken();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
