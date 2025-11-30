"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { signIn, signOut, getSession } from "next-auth/react";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import {
  ModalAction,
  ModalResult,
  ModalStage,
  User,
  UserRoles,
} from "@/lib/types";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface ErrorState {
  [key: string]: { hasError: boolean; message: string };
}

interface AppState {
  auth: AuthState;
  files: File[];
  isLoading: boolean;
  isCollapsed: boolean;
  selectedDeliverable: any | null;
  error: string | null;
  errors: ErrorState;

  setFiles: (files: File[] | ((prevFiles: File[]) => File[])) => void;

  isOpen: boolean;
  stage: ModalStage;
  currentAction: ModalAction | null;
  actionResult: ModalResult | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  actionCallback?: () => void;
  goBack?: () => void;
  openModal: (action: ModalAction) => void;
  closeModal: () => void;
  handleConfirm: () => Promise<void>;
  handleResultAction: () => void;
  setStage: (stage: ModalStage) => void;

  selectedUser: any | null;
  setSelectedUser: (user: any) => void;

  setLoading: (loading: boolean) => void;
  setIsCollapsed: (value: boolean) => void;
  setSelectedDeliverable: (deliverable: any | null) => void;
  setError: (error: string | null) => void;
  setErrors: (
    field: string,
    hasError: boolean,
    message?: string,
    showToast?: boolean
  ) => void;
  loadSession: () => Promise<void>;
  login: (
    username: string,
    password: string,
    returnUrl?: string
  ) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetStore: () => void;
  hasRole: (role: UserRoles) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      auth: { user: null, isAuthenticated: false },
      files: [],
      isLoading: false,
      isCollapsed: false,
      selectedDeliverable: null,
      error: null,
      errors: {},

      isOpen: false,
      stage: "confirmation",
      currentAction: null,
      actionResult: null,
      actionCallback: undefined,
      rejectReason: "",

      selectedUser: null,

      setRejectReason: (reason) => {
        set({ rejectReason: reason });
      },

      setFiles: (files) =>
        set((state) => ({
          files: typeof files === "function" ? files(state.files) : files,
        })),

      setSelectedUser: (user) => set({ selectedUser: user }),

      setLoading: (loading) => set({ isLoading: loading }),

      setIsCollapsed: (value) => set({ isCollapsed: value }),

      setSelectedDeliverable: (deliverable) =>
        set({ selectedDeliverable: deliverable }),

      setError: (error) => {
        if (error) {
          showError(error);
        }
        set({ error });
      },

      setErrors: (field, hasError, message = "", showToast = true) => {
        set((state) => ({
          errors: {
            ...state.errors,
            [field]: { hasError, message },
          },
        }));

        if (hasError && message && showToast) {
          toast.error(message);
        }
      },

      loadSession: async () => {
        set({ isLoading: true });
        try {
          const session = await getSession();
          if (session?.user) {
            set({
              auth: {
                user: session.user as any,
                isAuthenticated: true,
              },
              isLoading: false,
            });
          } else {
            set({
              auth: { user: null, isAuthenticated: false },
              isLoading: false,
            });
          }
        } catch (error) {
          showError("Failed to load session");
          set({
            error: "Failed to load session",
            isLoading: false,
            auth: { user: null, isAuthenticated: false },
          });
        }
      },

      login: async (username, password, returnUrl) => {
        set({ isLoading: true, error: null });
        try {
          const provider =
            process.env.NODE_ENV === "development" ? "mock" : "backend";

          const result = await signIn(provider, {
            username,
            password,
            redirect: false,
          });

          if (result?.error) {
            showError(`Login failed: ${result.error}`);
            set({ error: result.error, isLoading: false });
            return { success: false };
          } else {
            showSuccess(`Welcome back, ${username}!`);
            await get().loadSession();
            return { success: true };
          }
        } catch (error) {
          showError("Login failed due to an unexpected error");
          set({ error: "Login failed", isLoading: false });
          return { success: false };
        }
      },

      logout: async () => {
        try {
          await signOut({ redirect: false });
          set({
            auth: { user: null, isAuthenticated: false },
            error: null,
          });
          showInfo("You have been logged out");
        } catch (error) {
          showError("Logout failed");
          set({ error: "Logout failed" });
        }
      },

      hasRole: (role: UserRoles) => {
        const { user } = get().auth;
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
      },

      clearError: () => {
        set({ error: null });
      },

      openModal: (action: ModalAction) => {
        set({
          isOpen: true,
          stage: "confirmation",
          currentAction: action,
          actionResult: null,
        });
      },

      goBack: () => {
        const { currentAction } = get();

        if (currentAction?.previousAction) {
          set({
            currentAction: currentAction.previousAction,
            stage: "confirmation",
          });
        } else {
          get().closeModal();
        }
      },

      closeModal: () => {
        const { currentAction } = get();

        if (
          currentAction?.onCancel &&
          typeof currentAction.onCancel === "function"
        ) {
          currentAction.onCancel();
        }

        set({
          isOpen: false,
          actionCallback: undefined,
        });
      },

      setStage: (stage) => {
        set({ stage });
      },

      handleConfirm: async () => {
        const { currentAction } = get();

        if (!currentAction) return;

        set({ stage: "loading" });

        try {
          const result = await currentAction.onConfirm();

          if (result.skipResultScreen) {
            return;
          }

          set({
            stage: "result",
            actionCallback: result.callbackFunction,
            actionResult: {
              success: result.success,
              displayText:
                result.displayText || (result.success ? "Success!" : "Failed"),
              buttonText: result.buttonText || "Close",
              icon: result.icon,
              redirectPath: result.redirectPath,
            },
          });

          // Log state after setting
          const state = get();
        } catch (error) {
          set({
            stage: "result",
            actionCallback: undefined,
            actionResult: {
              success: false,
              displayText: "An error occurred",
              buttonText: "Close",
              icon: "/icons/alert-error.svg",
            },
          });

          // Log state after setting
          const state = get();
        }
      },

      handleResultAction: () => {
        const { actionCallback, actionResult, closeModal } = get();

        if (actionCallback && typeof actionCallback === "function") {
          actionCallback();
        }

        closeModal();
      },

      resetStore: () => {
        set({
          auth: { user: null, isAuthenticated: false },
          isLoading: false,
          error: null,
          isOpen: false,
          stage: "confirmation",
          currentAction: null,
          actionResult: null,
          actionCallback: undefined,
          selectedDeliverable: null,
        });
      },
    }),
    {
      name: "OmnichannelCustomerManagement",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        errors: state.errors,
        selectedUser: state.selectedUser,
        isCollapsed: state.isCollapsed,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return persistedState;
      },
      skipHydration: typeof window === "undefined",
    }
  )
);
