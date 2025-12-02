import { roomService } from "@/app/api/_services/room.service";
import { CreateUserPayload, UserTableFilter } from "@/lib/types";
import { setIsLoading } from "@/store//slice/loadingSlice";
import { useDispatch } from "react-redux";
import { PaginatedRequestPayload } from "./useTableData";

export const useRoomService = () => {
  const dispatch = useDispatch();
  const setLoading = (value: boolean) => {
    dispatch(setIsLoading(value));
  };
// ;
  // const fetchAllUsers = async (payload: UserTableFilter): Promise<any> => {
  const fetchAllRooms = async (
    payload: PaginatedRequestPayload
  ): Promise<any> => {
    try {
      // console.log("fetchAllRooms payload:", payload);

      setLoading(true);
      const response = await roomService.fetchAllRooms(payload);

      // console.log("fetchAllRooms response:", response);
      return response;
    } catch (err) {
      console.error("Error in fetchAllUsers:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewRoom = async (payload: CreateUserPayload): Promise<any> => {
    try {
      setLoading(true);
      const response = await roomService.createNewRoom(payload);

      // console.log("fetchReferenceLetterData response:", response);
      return response;
    } catch (err) {
      // console.error("Error in createNewUser:", err);
      throw err
    } finally {
      setLoading(false);
    }
  };

  const updateRoom = async (payload: CreateUserPayload): Promise<any> => {
    try {
      setLoading(true);
      const response = await roomService.updateRoom(payload);

      // console.log("fetchReferenceLetterData response:", response);
      return response;
    } catch (err) {
      // console.error("Error in createNewUser:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: number): Promise<any> => {
    try {
      setLoading(true);
      const response = await roomService.deleteRoom(roomId);

      // console.log("fetchReferenceLetterData response:", response);
      return response;
    } catch (err) {
      // console.error("Error in createNewUser:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchAllRooms,
    createNewRoom,
    updateRoom,
    deleteRoom,
  };
};
