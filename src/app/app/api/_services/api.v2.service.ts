import headers, {
  bookingHeaders,
  middlewareHeaders,
  roomHeaders,
} from "./headers.service";
import * as https from "node:https";
import Endpoints, { Backend } from "../_endpoints/api.endpoint";
import axios, { AxiosError, AxiosInstance } from "axios";
import { AuthenticationRequest, EntrustRequest } from "../_models/api.model";
import { ApiResponse, CreateUserPayload, UserTableFilter } from "@/lib/types";
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
  auth!: AxiosInstance;
  room!: AxiosInstance;
  booking!: AxiosInstance;
  http!: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string = "") {
    this.accessToken = accessToken;
    this.setupAuthClient();
    this.setupRoomClient();
    this.setupBookingClient();
    this.setupHttpClient();
  }

  private setupAuthClient() {
    this.auth = axios.create({
      baseURL: Backend.auth,
      headers: {
        ...middlewareHeaders,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === "production",
      }),
    });

    // Inject token dynamically
    this.auth.interceptors.request.use((req) => {
      if (this.accessToken) {
        req.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      // console.log("Outgoing Auth Header:", req.headers.Authorization);

      return req;
    });
  }

  private setupRoomClient() {
    this.room = axios.create({
      baseURL: Backend.room,
      headers: {
        ...roomHeaders,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === "production",
      }),
    });

    // Inject token dynamically
    this.room.interceptors.request.use((req) => {
      if (this.accessToken) {
        req.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return req;
    });
  }

  private setupBookingClient() {
    this.booking = axios.create({
      baseURL: Backend.booking,
      headers: {
        ...bookingHeaders,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === "production",
      }),
    });

    // Inject token dynamically
    this.booking.interceptors.request.use((req) => {
      if (this.accessToken) {
        req.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return req;
    });
  }

  private setupHttpClient() {
    this.http = axios.create({
      baseURL: Backend.auth,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === "production",
      }),
    });

    // Inject token dynamically
    this.http.interceptors.request.use((req) => {
      if (this.accessToken) {
        req.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return req;
    });
  }

  updateAccessToken(newToken: string) {
    this.accessToken = newToken;
    // No need to recreate clients — interceptors will use the new token
  }

  clearAccessToken() {
    this.accessToken = "";
  }

  static async createWithSession(): Promise<ApiService> {
    const session = await getServerSession(authOptions);
    const accessToken = (session?.accessToken as string) || "";
    return new ApiService(accessToken);
  }

  async validateUser(data: AuthenticationRequest) {
    try {
      const response = await this.auth.post(
        Endpoints.Authentication.login,
        data
      );

      return response.data as any;
    } catch (error: any) {
      console.error("[validateUser] Authentication error:", error);
      throw handleError(error);
    }
  }

  async authenticateEntrust(data: EntrustRequest) {
    try {
      const response = await this.auth.post(
        Endpoints.Authentication.validateADuser,
        data
      );

      return response.data as any;
    } catch (error: any) {
      throw handleError(error);
    }
  }

  async logout() {
    try {
      const response = await this.auth.post(Endpoints.Authentication.logout);

      return response.data;
    } catch (error) {
    } finally {
      this.clearAccessToken();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async fetchAllUsers(filter: UserTableFilter) {
    try {
      const response = await this.auth.get(
        Endpoints.Authentication.getAllUsers,
        {
          params: filter,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data as any;
    } catch (error: any) {
      // console.error("[fetchAllUsers] error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
      }
      throw handleError(error);
    }
  }

  async createNewUser(data: CreateUserPayload) {
    try {
      const response = await this.auth.post(
        Endpoints.Authentication.createUser,
        data
      );

      return response.data as any;
    } catch (error: any) {
      // console.error("[fetchAllUsers] error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
      }
      throw handleError(error);
    }
  }
}
