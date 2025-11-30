"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import ProtectedRouteProvider from "./protected";
import { ConfirmationModal } from "./components/ConfirmationModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: "my-toast",
        }}
        theme="system"
        closeButton
        richColors
        expand={false}
      />
      <ConfirmationModal />
      <ProtectedRouteProvider>{children}</ProtectedRouteProvider>
    </SessionProvider>
  );
}
