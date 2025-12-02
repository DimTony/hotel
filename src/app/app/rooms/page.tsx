"use client";

import { useTableData } from "@/hooks/useTableData";
import {
  Eye,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { Table } from "../components/Table";
import { TableControls } from "../components/TableControls";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import Image from "next/image";
import { UserFormModal } from "../components/UserManagement/AddEditForm";
import { toast } from "sonner";
import { useStatusModal } from "@/hooks/useStatusModal";
import { DeleteConfirmModal } from "../components/UserManagement/Delete";
import { useSession } from "next-auth/react";
import { RoomCard } from "../components/Rooms/Card";
import { useRoomService } from "@/hooks/useRoomService";
import { Room } from "@/lib/types";

interface RoomFilters {
  search: string;
  status: string;
  roomType: string;
  roomNumber: string;
  minPrice: string;
  maxPrice: string;
  checkInDate: string;
  checkOutDate: string;
}

// Popover Component
const Popover = ({
  trigger,
  children,
  isOpen,
  onClose,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={popoverRef}>
      {trigger}
      {isOpen && (
        <div className="absolute top-full mt-2 z-50 backdrop-blur-xl bg-white/95 border border-gray-200 rounded-lg shadow-xl min-w-[200px]">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Example: RoomManagement Component with Advanced Filters
 */
const RoomManagement = () => {
  const { fetchAllRooms } = useRoomService();
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<Room | null>(null);

  // Popover states
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [roomTypePopoverOpen, setRoomTypePopoverOpen] = useState(false);

  // Temporary filter states (before applying)
  const [tempFilters, setTempFilters] = useState({
    search: "",
    status: "",
    roomType: "",
    roomNumber: "",
    minPrice: "",
    maxPrice: "",
    checkInDate: "",
    checkOutDate: "",
  });

  // Use the reusable paginated data hook
  const {
    data: rooms,
    loading,
    currentPage,
    totalPages,
    totalCount,
    filters,
    pageSize,
    setCurrentPage,
    setFilters,
    fetchData,
    refetch,
  } = useTableData<Room, RoomFilters>(fetchAllRooms, {
    pageSize: 10,
    initialFilters: {
      search: "",
      status: "",
      roomType: "",
      roomNumber: "",
      minPrice: "",
      maxPrice: "",
      checkInDate: "",
      checkOutDate: "",
    },
  });

  // Fetch data when component mounts or page changes
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Check if any filters are active (including search)
  const hasActiveFilters = () => {
    return (
      tempFilters.search !== "" ||
      tempFilters.status !== "" ||
      tempFilters.roomType !== "" ||
      tempFilters.roomNumber !== "" ||
      tempFilters.minPrice !== "" ||
      tempFilters.maxPrice !== "" ||
      tempFilters.checkInDate !== "" ||
      tempFilters.checkOutDate !== ""
    );
  };

  // Handle search - Apply all filters
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      ...tempFilters,
    }));
  };

  const handleSearchInput = (value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const handleAddRoom = () => {
    setModalMode("create");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      search: "",
      status: "",
      roomType: "",
      roomNumber: "",
      minPrice: "",
      maxPrice: "",
      checkInDate: "",
      checkOutDate: "",
    };
    setTempFilters(clearedFilters);
    setFilters((prev) => ({
      ...prev,
      ...clearedFilters,
    }));
  };

  // Update temp filter
  const updateTempFilter = (key: string, value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Status options
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "available", label: "Available" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Maintenance" },
    { value: "reserved", label: "Reserved" },
  ];

  // Room type options
  const roomTypeOptions = [
    { value: "", label: "All Types" },
    { value: "single", label: "Single" },
    { value: "double", label: "Double" },
    { value: "suite", label: "Suite" },
    { value: "deluxe", label: "Deluxe" },
    { value: "presidential", label: "Presidential" },
  ];

  const Rooms = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((_, index) => (
            <div
              key={index}
              className="backdrop-blur-xl animate-pulse bg-white/20 w-full h-48 rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-28 bg-white/30"></div>

              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/30 rounded w-2/3"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-4 gap-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    );
  };


  return (
    <div className="relative min-h-screen h-full w-full bg-[url('/images/home.jpg')] bg-cover bg-center pt-10 px-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 text-white py-6">
        <section>
          <div className="relative flex justify-between backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 shadow-2xl">
            <span className="text-xl font-semibold">Rooms</span>

            <button
              onClick={handleAddRoom}
              className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 text-white 
      rounded-md text-sm hover:bg-white/65 hover:text-black cursor-pointer transition-all duration-300"
            >
              <Plus size={16} />
              Add Room
            </button>
          </div>

          <div className="flex items-center my-2 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="reservations, rooms..."
                  value={tempFilters.search}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className={`w-54 pl-3 pr-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 ${
                    tempFilters.search
                      ? "bg-blue-500/80 text-white placeholder:text-white/70"
                      : "bg-white/10 text-white placeholder:text-white/50 hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>

              {/* Status Filter Popover */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Status
                </label>
                <Popover
                  isOpen={statusPopoverOpen}
                  onClose={() => setStatusPopoverOpen(false)}
                  trigger={
                    <button
                      onClick={() => setStatusPopoverOpen(!statusPopoverOpen)}
                      className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 ${
                        tempFilters.status
                          ? "bg-white/70 text-gray-800 font-medium"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {tempFilters.status || "All"}
                    </button>
                  }
                >
                  <div className="p-3">
                    <div className="text-sm font-semibold mb-2 text-gray-800">
                      Select Status
                    </div>
                    <div className="space-y-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateTempFilter("status", option.value);
                            setStatusPopoverOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all ${
                            tempFilters.status === option.value
                              ? "bg-gray-500 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Popover>
              </div>

              {/* Room Type Filter Popover */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Room Type
                </label>
                <Popover
                  isOpen={roomTypePopoverOpen}
                  onClose={() => setRoomTypePopoverOpen(false)}
                  trigger={
                    <button
                      onClick={() =>
                        setRoomTypePopoverOpen(!roomTypePopoverOpen)
                      }
                      className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 ${
                        tempFilters.roomType
                          ? "bg-white/70 text-gray-800 font-medium"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {tempFilters.roomType || "All"}
                    </button>
                  }
                >
                  <div className="p-3">
                    <div className="text-sm font-semibold mb-2 text-gray-800">
                      Select Room Type
                    </div>
                    <div className="space-y-1">
                      {roomTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateTempFilter("roomType", option.value);
                            setRoomTypePopoverOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all ${
                            tempFilters.roomType === option.value
                              ? "bg-gray-500 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Popover>
              </div>

              {/* Room Number Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={tempFilters.roomNumber}
                  onChange={(e) =>
                    updateTempFilter("roomNumber", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 w-18 ${
                    tempFilters.roomNumber
                      ? "bg-blue-500/80 text-white placeholder:text-white/70"
                      : "bg-white/10 text-white placeholder:text-white/50 hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>

              {/* Min Price Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={tempFilters.minPrice}
                  onChange={(e) => updateTempFilter("minPrice", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 w-28 ${
                    tempFilters.minPrice
                      ? "bg-blue-500/80 text-white placeholder:text-white/70"
                      : "bg-white/10 text-white placeholder:text-white/50 hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>

              {/* Max Price Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={tempFilters.maxPrice}
                  onChange={(e) => updateTempFilter("maxPrice", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 w-28 ${
                    tempFilters.maxPrice
                      ? "bg-blue-500/80 text-white placeholder:text-white/70"
                      : "bg-white/10 text-white placeholder:text-white/50 hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>

              {/* Check-in Date Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Check-in
                </label>
                <input
                  type="date"
                  value={tempFilters.checkInDate}
                  onChange={(e) =>
                    updateTempFilter("checkInDate", e.target.value)
                  }
                  className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 ${
                    tempFilters.checkInDate
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>

              {/* Check-out Date Input */}
              <div className="relative">
                <label className="block text-[10px] text-white/70 mb-0.5 ml-1">
                  Check-out
                </label>
                <input
                  type="date"
                  value={tempFilters.checkOutDate}
                  onChange={(e) =>
                    updateTempFilter("checkOutDate", e.target.value)
                  }
                  className={`px-3 py-1.5 text-xs rounded-md backdrop-blur-xl transition-all duration-300 ${
                    tempFilters.checkOutDate
                      ? "bg-blue-500/80 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  } focus:ring-2 focus:ring-white/50 focus:outline-none`}
                />
              </div>
            </div>

            {hasActiveFilters() && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className={`p-2 flex justify-center items-center rounded-md backdrop-blur-xl transition-all ${
                    loading
                      ? "bg-white/30 cursor-not-allowed opacity-50"
                      : "bg-white/50 hover:bg-white/20 cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Search size={14} />
                  )}
                </button>

                <button
                  onClick={clearAllFilters}
                  disabled={loading}
                  className={`p-2 flex justify-center items-center rounded-md backdrop-blur-xl transition-all ${
                    loading
                      ? "bg-white/10 cursor-not-allowed opacity-50"
                      : "bg-white/20 hover:bg-white/30 cursor-pointer"
                  }`}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Rooms />

            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 shadow-2xl">
              <TableControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemName="rooms"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RoomManagement;
