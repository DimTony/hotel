import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Bell } from "lucide-react";

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
      callbackUrl: "/dashboard",
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
    <div className="w-full px-[20px] py-[8px] border-b border-[#E5E9F2] flex justify-end bg-white">
      <div className="flex gap-[1rem] items-center">
        {/* <Bell className="cursor-pointer hover:text-gray-600" /> */}
        <div ref={dropdownRef} className="relative">
          <button
            // onClick={toggleDropdown}
            className="flex items-center cursor-pointer gap-[1rem] p-2 hover:bg-[#F4F4F4] rounded-[1rem]"
          >
            {/* Custom Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#526484] flex items-center justify-center text-white text-sm font-semibold">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(name)}</span>
              )}
            </div>

            <div className="flex flex-col items-start">
              <span className="text-dm font-[700] text-[13px] leading-[16px] text-[#526484]">
                {name}
              </span>
              <p className="text-[9px] font-[300] leading-[16px] text-[#526484]">
                {role}
              </p>
              {/* <Image
                src="/icons/down-caret.svg"
                alt="caret Icon"
                width={12.65}
                height={14.16}
              /> */}
            </div>
          </button>

          {/* {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <ul className="py-2">
                <li className="px-4 py-2 hover:bg-[#F4F4F4] cursor-pointer">
                  Profile
                </li>
                <li className="px-4 py-2 hover:bg-[#F4F4F4] cursor-pointer">
                  Settings
                </li>
                <li className="hover:bg-[#F4F4F4] cursor-pointer">
                  <button
                    className="px-4 py-2 flex items-start w-full h-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
