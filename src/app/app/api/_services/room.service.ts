import { PaginatedRequestPayload } from "@/hooks/useTableData";
import { CreateUserPayload, UserTableFilter } from "@/lib/types";
import axios from "axios";

const api = axios.create({
  baseURL: "/api/rooms",
  headers: {
    "Content-Type": "application/json",
  },
});

export const roomService = {
  //
  // fetchAllUsers: async (payload: UserTableFilter) => {
  fetchAllRooms: async (payload: PaginatedRequestPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "fetchAllRooms",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching all user data:", error);
      throw error;
    }
  },

  createNewRoom: async (payload: CreateUserPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "createNewRoom",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateRoom: async (payload: CreateUserPayload) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "updateRoom",
        data: payload,
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteRoom: async (roomId: number) => {
    try {
      const response = await api.post("", {
        //   const { data } = await api.post("", {
        action: "deleteRoom",
        data: { roomId },
      });
      // console.log("response usuusdata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
