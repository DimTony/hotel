import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  open: boolean;
}

const initialState: UIState = {
  open: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleOpen: (state) => {
      return {
        ...state,
        open: !state.open,
      };
    },

    setOpen: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        open: action.payload,
      };
    },
  },
});

export const { toggleOpen, setOpen } = uiSlice.actions;
export default uiSlice.reducer;
