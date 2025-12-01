import { userService } from "@/app/api/_services/user.service";
import { CreateUserPayload, UserTableFilter } from "@/lib/types";
import { setIsLoading } from "@/store//slice/loadingSlice";
import { useDispatch } from "react-redux";
import { PaginatedRequestPayload } from "./useTableData";

export const useUserService = () => {
  const dispatch = useDispatch();
  const setLoading = (value: boolean) => {
    dispatch(setIsLoading(value));
  };
// ;
  // const fetchAllUsers = async (payload: UserTableFilter): Promise<any> => {
  const fetchAllUsers = async (
    payload: PaginatedRequestPayload
  ): Promise<any> => {
    try {
      setLoading(true);
      const response = await userService.fetchAllUsers(payload);

      // console.log("fetchReferenceLetterData response:", response);
      return response;
    } catch (err) {
      console.error("Error in fetchAllUsers:", err);
    } finally {
      setLoading(false);
    }
  };

  const createNewUser = async (payload: CreateUserPayload): Promise<any> => {
    try {
      setLoading(true);
      const response = await userService.createNewUser(payload);

      // console.log("fetchReferenceLetterData response:", response);
      return response;
    } catch (err) {
      // console.error("Error in createNewUser:", err);
      throw err
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchAllUsers,
    createNewUser,
  };
};
