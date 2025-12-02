import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const useUserRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const logPrefix = `[useUserRoles ${new Date().toISOString()}]`;
    const getRoles = () => {
      // Try to get roles from session
      if (session?.user?.role) {
        // console.log(`${logPrefix} Got roles from session:`, session.user.role);
        return session.user.role;
      }

      //   console.log(`${logPrefix} No roles in session, checking localStorage...`);

      // Try to get roles from localStorage
      const savedSession = localStorage.getItem("session");
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          if (parsedSession?.user?.role) {
            // console.log(
            //   `${logPrefix} Got roles from localStorage:`,
            //   parsedSession.user.role
            // );
            return parsedSession.user.role;
          }
        } catch (error) {
          console.error(`${logPrefix} Error parsing saved session:`, error);
        }
      }

      //   console.log(`${logPrefix} No roles found`);
      return [];
    };

    const newRoles = getRoles() || [];
    // console.log(`${logPrefix} Setting roles:`, newRoles);
    setRoles(newRoles);
  }, [session]);

  return roles;
};

export const normalizeRole = (role: string) => role.toUpperCase().trim();

// Individual role check hooks
export const useIsAdmin = () => {
  const roles = useUserRoles();
  console.log("[USER ROLES]:", roles);

  return roles?.some((role) => normalizeRole(role) === "ADMIN") ?? false;
};

export const useIsManager = () => {
  const roles = useUserRoles();
  return roles?.some((role) => normalizeRole(role) === "MANAGER") ?? false;
};

export const useIsReceptionist = () => {
  const roles = useUserRoles();
  return roles?.some((role) => normalizeRole(role) === "RECEPTIONIST") ?? false;
};

export const useIsGuest = () => {
  const roles = useUserRoles();
  return roles?.some((role) => normalizeRole(role) === "GUEST") ?? false;
};
