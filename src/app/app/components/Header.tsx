import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut } from "lucide-react";

const DashboardHeader = () => {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const name = session.user?.name || "User";
  const image = session.user?.image || undefined;
  const role = session.user?.role.join(", ") || undefined;

  // Get initials for fallback avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <nav className="mx-auto p-4">
        <div className="flex justify-between items-center px-8 md:px-8">
          <div className="flex-1" /> {/* Spacer for left side */}
          <div className="flex-1 flex justify-end items-center gap-3 text-white">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium">
                {session?.user.fullName?.toUpperCase() ||
                  session?.user.firstName}
              </span>
              <span className="text-[9px] font-medium">
                {session?.user.role?.join(" ")}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-primary p-1.5 rounded hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden md:flex">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default DashboardHeader;
