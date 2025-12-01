import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'failed';
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (
      state, 
      action: PayloadAction<Omit<Toast, 'id'>>
    ) => {
      const newToast = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
      };
      state.toasts.push(newToast);
    },
    removeToast: (
      state, 
      action: PayloadAction<string>
    ) => {
      state.toasts = state.toasts.filter(
        toast => toast.id !== action.payload
      );
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
