import { PaginatedRequestPayload } from "@/hooks/useTableData";
import { CreateUserPayload, UserTableFilter } from "@/lib/types";
import axios from "axios";

const api = axios.create({
  baseURL: "/api/users",
  headers: {
    "Content-Type": "application/json",
  },
});

export const userService = {
  //
  // fetchAllUsers: async (payload: UserTableFilter) => {
  fetchAllUsers: async (payload: PaginatedRequestPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "fetchAllUsers",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching all user data:", error);
      throw error;
    }
  },

  createNewUser: async (payload: CreateUserPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "createNewUser",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (payload: CreateUserPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "updateUser",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (userId: number) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "deleteUser",
        data: { userId },
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
