"use client";

import { showInfo } from "@/utils/toast";
import { signOut } from "next-auth/react";
import { useState } from "react";

export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        showInfo("You have been logged out");
      } else {
        console.warn(
          "Backend logout failed, but proceeding with frontend logout"
        );
      }

      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Error during logout:");

      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
};
