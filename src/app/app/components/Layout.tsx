"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu as MenuIcon,
  X as XIcon,
  Menu,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import Image from "next/image";
import {
  DashboardLayoutProps,
  SidebarItem,
  SidebarProps,
  UserRoles,
} from "@/lib/types";
import { signOut, useSession } from "next-auth/react";
import { useStore } from "@/store/store";
import { Session } from "next-auth";
import Loading from "./Loading";
import DashboardHeader from "./Header";
import { useLogout } from "@/hooks/useLogout";

const SIDEBAR_ITEMS = (session: Session): SidebarItem[] => {
  if (!session) return [];

  // ✅ Check if user is SuperAdmin FIRST
  const isSuperAdmin = session?.user?.role?.some(
    (ele) => ele === UserRoles.superAdmin
  );

  // If SuperAdmin, only show User Management
  if (isSuperAdmin) {
    return [
      {
        label: "User Management",
        href: "/user-management",
        icon: (
          <Image
            src="/icons/userm.svg"
            alt="User Icon"
            width={20}
            height={20}
            className="sidebar-icon"
          />
        ),
        children: [
          {
            label: "Pending Requests",
            href: "/user-management/pending-requests",
          },
        ],
      },
    ];
  }

  // For all other roles, show their respective menus
  return [
    session?.user?.role?.some((ele) => ele === UserRoles.admin) ||
    session?.user?.role?.some((ele) => ele === UserRoles.accountOfficer) ||
    session?.user?.role?.some((ele) => ele === UserRoles.user)
      ? {
          label: "Dashboard",
          href: "/dashboard",
          icon: (
            <Image
              src="/icons/dashboard.svg"
              alt="Dashboard Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,

    session?.user?.role?.some((ele) => ele === UserRoles.admin) ||
    session?.user?.role?.some((ele) => ele === UserRoles.user)
      ? {
          label: "Create Items",
          href: "/create-items",
          icon: (
            <Image
              src="/icons/create.svg"
              alt="Create Items Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,

    session?.user?.role?.some((ele) => ele === UserRoles.accountOfficer) ||
    session?.user?.role?.some((ele) => ele === UserRoles.admin) ||
    session?.user?.role?.some((ele) => ele === UserRoles.user)
      ? {
          label: "View Deliverables",
          href: "/view-deliverables",
          icon: (
            <Image
              src="/icons/view-deliverables.svg"
              alt="View Deliverables Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,

    session?.user?.role?.some((ele) => ele === UserRoles.admin) ||
    session?.user?.role?.some((ele) => ele === UserRoles.user)
      ? {
          label: "Group Heads",
          href: "/group-heads",
          icon: (
            <Image
              src="/icons/group-head.svg"
              alt="Group Heads Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,

    session?.user?.role?.some((ele) => ele === UserRoles.admin)
      ? {
          label: "Escalation Matrix",
          href: "/escalation-matrix",
          icon: (
            <Image
              src="/icons/matrix.svg"
              alt="Matrix Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,

    session?.user?.role?.some((ele) => ele === UserRoles.admin)
      ? {
          label: "Audit Trail",
          href: "/audit-trails",
          icon: (
            <Image
              src="/icons/audit-trail.svg"
              alt="Matrix Icon"
              width={20}
              height={20}
              className="sidebar-icon"
            />
          ),
        }
      : void 0,
  ].filter((item) => item !== undefined) as SidebarItem[];
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isMobile,
  isCollapsed,
  toggleSidebar,
  toggleCollapse,
}) => {
  const { logout, isLoggingOut } = useLogout();
  const pathname = usePathname();
  const { data: session } = useSession();
  const sidebarItems = useMemo(
    () => SIDEBAR_ITEMS(session as Session),
    [session]
  );
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (session) {
      const activeParents = findActiveParentAndAncestors(
        pathname,
        sidebarItems
      );

      const initialState = sidebarItems.reduce((acc, item) => {
        if (item.children) {
          acc[item.label] = activeParents.has(item.label);
        }
        return acc;
      }, {} as { [key: string]: boolean });

      setOpenDropdowns(initialState);
    }
  }, [session, sidebarItems, pathname]);

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isRouteActive = (
    currentPath: string,
    targetPath?: string,
    hasChildren: boolean = false
  ): boolean => {
    if (!targetPath) return false;

    if (currentPath === targetPath) return true;

    if (hasChildren || targetPath.split("/").length > 2) {
      const targetSegments = targetPath.split("/").filter(Boolean);
      const currentSegments = currentPath.split("/").filter(Boolean);

      return targetSegments.every(
        (segment, index) => currentSegments[index] === segment
      );
    }

    return false;
  };

  const findActiveParentAndAncestors = (
    pathname: string,
    sidebarItems: SidebarItem[]
  ): Set<string> => {
    const activeItems = new Set<string>();

    const checkItemAndChildren = (item: SidebarItem): boolean => {
      if (
        item.href &&
        isRouteActive(
          pathname,
          item.href,
          item.children && item.children.length > 0
        )
      ) {
        activeItems.add(item.label);
        return true;
      }

      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some((child) =>
          checkItemAndChildren(child as any)
        );

        if (hasActiveChild) {
          activeItems.add(item.label);
          return true;
        }
      }

      return false;
    };

    sidebarItems.forEach((item) => checkItemAndChildren(item));

    return activeItems;
  };

  const renderMenuItem = (item: SidebarItem, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const activeItems = findActiveParentAndAncestors(pathname, sidebarItems);

    const isActive = activeItems.has(item.label);
    const isDropdownOpen = openDropdowns[item.label] || false;

    // Check if the parent itself is the current page (exact match)
    const isParentCurrentPage = item.href
      ? isRouteActive(pathname, item.href, false)
      : false;

    // Check if any child is active
    const hasActiveChild =
      hasChildren &&
      item.children?.some((child) =>
        child.href ? isRouteActive(pathname, child.href) : false
      );

    const originalIcon = item.icon as any;
    const originalSrc = originalIcon.props.src;

    const activeSrc = originalSrc.replace(/\.svg$/, "-active.svg");

    const iconElement = (
      <Image
        src={isActive ? activeSrc : originalSrc}
        alt={originalIcon.props.alt}
        width={originalIcon.props.width}
        height={originalIcon.props.height}
        className={originalIcon.props.className}
      />
    );

    if (hasChildren) {
      // Determine the background class for parent with children
      let parentBgClass = "text-[#526484]";
      if (isParentCurrentPage) {
        // Parent itself is the current page → /100
        parentBgClass = "bg-[#ebeef2] text-[#003883]";
      } else if (hasActiveChild) {
        // A child is active → /30
        parentBgClass = "bg-[#ebeef2]/30 text-[#003883]";
      }

      return (
        <div key={`${item.label}-${index}`} className="relative">
          <div
            onClick={() => toggleDropdown(item.label)}
            className={`mx-3 rounded-[6px] flex items-center p-3 hover:bg-[#F4F4F4] cursor-pointer ${
              isCollapsed && !isMobile ? "justify-center" : ""
            } ${parentBgClass}`}
          >
            {iconElement}
            {!(isCollapsed && !isMobile) && (
              <>
                <span className="ml-3 flex-1 font-dm font-[700] text-[12px] leading-[20px] tracking-[0.15px]">
                  {item.label}
                </span>
                {hasChildren && (
                  <ChevronDownIcon
                    className={`w-4 h-4 transform transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </>
            )}
          </div>
          {isDropdownOpen && !(isCollapsed && !isMobile) && (
            <div className="pl-6 mt-1 mb-1">
              {item.children?.map((child, childIndex) => {
                const isChildActive = child.href
                  ? isRouteActive(pathname, child.href)
                  : false;

                return (
                  <Link
                    key={`${child.href || child.label}-${childIndex}`}
                    href={child.href || "#"}
                    className={`mx-3 rounded-[6px] text-[12px] font-[700] flex items-center p-2.5 hover:bg-[#F4F4F4] ${
                      isChildActive
                        ? "bg-[#ebeef2] font-dm leading-[20px] text-[#003883]"
                        : "font-dm leading-[20px] text-[#526484]"
                    }`}
                  >
                    <span className="ml-2">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={`${item.href || item.label}-${index}`}
        href={item.href || "#"}
        className={`font-[700] flex items-center mx-3 rounded-[6px] p-3 hover:bg-[#F4F4F4] ${
          isActive ? "bg-[#ebeef2] text-[#003883]" : "text-[#526484]"
        } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
      >
        {iconElement}
        {!(isCollapsed && !isMobile) && (
          <span className="ml-3 font-dm text-[12px] leading-[20px] tracking-[0.15px]">
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md lg:hidden"
        >
          {isOpen ? (
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      )}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-[100vh] bg-white text-gray-800 border-r border-b-[1px] border-gray-300 transition-all duration-300 ease-in-out z-50 flex flex-col ${
          isMobile
            ? `${isOpen ? "translate-x-0" : "-translate-x-full"} w-64`
            : `${isCollapsed ? "w-16" : "w-[260px]"}`
        }`}
      >
        <div className="p-4 flex items-center justify-between shrink-0">
          {!(isCollapsed && !isMobile) && (
            <Link
              href={
                session?.user?.role?.some(
                  (ele: string) => ele === UserRoles.superAdmin
                )
                  ? "/user-management"
                  : "/dashboard"
              }
            >
              <Image
                src="/icons/access-svg.svg"
                alt="Access icon"
                width={179}
                height={46}
                priority
                className="cursor-pointer"
              />
            </Link>
          )}
          {!isMobile && (
            <button onClick={toggleCollapse}>
              <Menu size={24} className="cursor-pointer hover:text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <nav
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E0 transparent",
            }}
          >
            <style jsx>{`
              nav::-webkit-scrollbar {
                width: 6px;
              }
              nav::-webkit-scrollbar-track {
                background: transparent;
              }
              nav::-webkit-scrollbar-thumb {
                background-color: #cbd5e0;
                border-radius: 3px;
              }
              nav:hover::-webkit-scrollbar-thumb {
                background-color: #a0aec0;
              }
            `}</style>
            <div className="flex flex-col gap-[1rem] pb-4">
              {!(isCollapsed && !isMobile) && (
                <span className="uppercase ml-[24px] font-dm font-[700] text-[11px] leading-[13.2px] tracking-[2.2px] text-[#8094ae]">
                  MENUS
                </span>
              )}
              {sidebarItems.map((item, index) => renderMenuItem(item, index))}
            </div>
          </nav>
        </div>

        <div className="shrink-0 p-3 ">
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full cursor-pointer flex items-center p-3 rounded-md hover:bg-[#F4F4F4]"
          >
            <Image
              src="/icons/logout.svg"
              alt="logout Icon"
              width={20}
              height={20}
            />

            {!(isCollapsed && !isMobile) && (
              <span className="ml-3 font-dm font-[700] text-[15px] leading-[20px] tracking-[0.15px] text-[#ee3148] ">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

const RootLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const { isCollapsed, setIsCollapsed } = useStore();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const publicRoutes = ["/", "/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ Client-side redirect for SuperAdmin as backup
  useEffect(() => {
    if (session && status === "authenticated") {
      const isSuperAdmin = session?.user?.role?.some(
        (ele: string) => ele === UserRoles.superAdmin
      );

      // If SuperAdmin is not on user-management page, redirect them
      if (isSuperAdmin && !pathname.startsWith("/user-management")) {
        window.location.href = "/user-management";
      }
    }
  }, [session, status, pathname]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/",
    });
  };

  if (status === "loading") {
    return <Loading />;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar
        isOpen={isOpen}
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapse={toggleCollapse}
      />
      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${
          isMobile ? "ml-0" : isCollapsed ? "ml-16" : "ml-[260px]"
        }`}
      >
        <div className="sticky top-0 z-40 bg-white">
          <DashboardHeader />
        </div>

        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
};

export default RootLayout;
