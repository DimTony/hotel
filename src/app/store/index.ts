import { configureStore } from "@reduxjs/toolkit";
import uiSlice from "./slice/uiSlice";
import loadingSlice from "./slice/loadingSlice";
import toastSlice from "./slice/toastSlice";

const store = configureStore({
  reducer: {
    uiSlice,
    loading: loadingSlice,
    toast: toastSlice,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
