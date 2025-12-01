"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import ProtectedRouteProvider from "./protected";
import { ConfirmationModal } from "./components/ConfirmationModal";
import Providers from "@/store/providers";
import { StatusModal } from "./components/Status";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Providers>
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
        <StatusModal />
        <ProtectedRouteProvider>{children}</ProtectedRouteProvider>
      </Providers>
    </SessionProvider>
  );
}
