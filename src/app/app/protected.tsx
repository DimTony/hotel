"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/store";
import { showWarning, showInfo } from "@/utils/toast";
import RootLayout from "./components/Layout";

const publicRoutes = ["/"];

export default function ProtectedRouteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { auth } = useStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [previousAuthState, setPreviousAuthState] = useState<string | null>(
    null
  );
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const currentAuthState = status;

    if (currentAuthState !== "loading") {
      if (
        previousAuthState === "unauthenticated" &&
        currentAuthState === "authenticated"
      ) {
        if (previousAuthState !== null) {
          showInfo("You have been authenticated");
        }
      }

      if (
        previousAuthState === "authenticated" &&
        currentAuthState === "unauthenticated"
      ) {
        showWarning("Your session has ended", {
          description: "Please log in again to continue.",
          action: {
            label: "Login",
            onClick: () => router.replace("/"),
          },
        });

        router.replace("/");
      }

      setPreviousAuthState(currentAuthState);
    }
  }, [status, previousAuthState, router]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (isInitialLoading || status === "loading") {
      return;
    }

    if (!isPublicRoute && status === "unauthenticated") {
      showWarning("Authentication Required", {
        description: "Please log in to access this page",
        duration: 5000,
      });
      router.replace("/");
    } else if (
      isPublicRoute &&
      status === "authenticated" &&
      pathname === "/"
    ) {
      router.replace("/dashboard");
    }
  }, [
    pathname,
    router,
    status,
    auth.isAuthenticated,
    isPublicRoute,
    isInitialLoading,
  ]);

  return status === "authenticated" && !isPublicRoute ? (
    <RootLayout>{children}</RootLayout>
  ) : (
    <>{children}</>
  );
}
