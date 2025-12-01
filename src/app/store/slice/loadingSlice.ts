import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const loadingSlice = createSlice({
  name: "loading",
  initialState: {
    isLoading: false,
  },
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {setIsLoading} = loadingSlice.actions;
export default loadingSlice.reducer;
