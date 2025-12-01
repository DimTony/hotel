"use client";

import { useTableData } from "@/hooks/useTableData";
import { useUserService } from "@/hooks/useUserService";
import { Eye, Plus, RotateCcw, Search, SquarePen, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Table } from "../components/Table";
import { TableControls } from "../components/TableControls";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import Image from "next/image";
import { UserFormModal } from "../components/UserManagement/AddEditForm";
import { toast } from "sonner";
import { useStatusModal } from "@/hooks/useStatusModal";

interface UserFilters {
  // status: string;
  // startDate: string;
  // endDate: string;
  // tab: "Pending" | "Claimed";
  search: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status?: string;
  isActive?: boolean;
}

/**
 * Example: UserManagement Component using Reusable Components
 *
 * This demonstrates the clean, reusable pattern for handling paginated data.
 */
const UserManagement = () => {
  const { fetchAllUsers, createNewUser } = useUserService();
  const { openConfirmationModal } = useConfirmationModal();
  const { showStatus, closeStatus } = useStatusModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Use the reusable paginated data hook
  const {
    data: users,
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
  } = useTableData<User, UserFilters>(fetchAllUsers, {
    pageSize: 10,
    initialFilters: {
      search: "",
      // status: "",
      // startDate: "",
      // endDate: "",
      // tab: "Pending",
    },
  });

  // Fetch data when component mounts or page changes
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput,
    }));

    // setCurrentPage(1);
    // fetchData(); // force reload with new filters
  };

  const handleResetSearch = () => {
    setSearchInput(""); // clear input

    setFilters({
      ...filters,
      search: "",
    });

    // setCurrentPage(1);

    // fetchData(); // refresh table with no search
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
  };

  const handleAddUser = () => {
    setModalMode("create");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    openConfirmationModal({
      title: "Add New User?",
      description: "Please confirm you want to add this new user.",
      icon: (
        <Image src="/icons/Infoicon.svg" alt="info" width={40} height={40} />
      ),
      confirmText: "Yes, Confirm",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          // const result = await addNewUser(values);
          const result: any = {};
          // setSubmitting(false);

          // console.log('RRREEEEE', result)

          if (result.statusCode !== 200) {
            return {
              success: false,
              displayText:
                result.message || "Failed to save changes. Please try again.",
              buttonText: "Close",
            };
          } else {
            // resetForm();
            return {
              success: true,
              displayText: result?.message || "User created successfully!",
              buttonText: "Close",
              icon: (
                <Image
                  src="/icons/modalCheck.svg"
                  width={80}
                  height={80}
                  alt=""
                />
              ),
              redirectPath: "/user-management/user-directory",
            };
          }
        } catch (error) {
          console.error("Error saving changes:", error);
          // setSubmitting(false);
          return {
            success: false,
            displayText: "Failed to save changes. Please try again.",
            buttonText: "Close",
          };
        }
      },
    });
  };

  const handleFormSubmit = async (userData: Partial<User>) => {
    try {
      if (modalMode === "create") {
        // console.log("Creating...", userData);

        const response = await createNewUser(userData);

        // console.log("CREATE RESPONSE:", response);

        if (!response.success) {
          throw new Error(response.message || "Operation failed");
        }
        setIsModalOpen(false);

        showStatus({
          success: true,
          icon: "",
          title: "Success!",
          message: response.message || "Operation Successful",
          onButtonClick: () => {
            closeStatus();
            refetch();
          },
          buttonText: "Close",
        });
      } else {
        console.log("Editing...", userData);
      }

      // refetch();
    } catch (error: any) {
      // console.error("AN ERROR:", error.response.data);
      toast.error(
        error.response.data.message || "An error occurred. Please try again."
      );
      throw error;
    }
  };

  // Define table columns using the reusable pattern
  const columns = [
    {
      key: "name",
      header: "Name",
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="flex flex-col">
            <span>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (user: User) => user.email,
    },
    {
      key: "role",
      header: "Role",
      render: (user: User) => user.role,
    },
    {
      key: "status",
      header: "Status",
      render: (user: User) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.status?.toLowerCase() === "active" || user.isActive
              ? "bg-green-600/40"
              : "bg-red-600/40"
          }`}
        >
          {user.status || (user.isActive ? "Active" : "Inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "py-3 px-2 text-right",
      render: (user: User) => (
        <div className="flex items-center justify-end gap-2">
          <button
            className="flex items-center justify-center backdrop-blur-xl bg-white/10 hover:bg-white/65 rounded-full p-1.5 cursor-pointer text-blue-300 hover:text-blue-400 text-xs transition-all duration-300"
            title="View"
            onClick={() => console.log("View user:", user.id)}
          >
            <Eye size={12} />
          </button>
          <button
            className="flex items-center justify-center backdrop-blur-xl bg-white/10 hover:bg-white/65 rounded-full p-1.5 cursor-pointer text-blue-300 hover:text-blue-400 text-xs transition-all duration-300"
            title="Edit"
            onClick={() => handleEditUser(user)}
          >
            <SquarePen size={12} />
          </button>
          <button
            className="flex items-center justify-center backdrop-blur-xl bg-white/10 hover:bg-white/65 rounded-full p-1.5 cursor-pointer text-red-300 hover:text-red-400 text-xs transition-all duration-300"
            title="Delete"
            onClick={() => handleDelete(user)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen h-full w-full bg-[url('/images/home.jpg')] bg-cover bg-center pt-10 px-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 text-white py-6">
        <section>
          <div className="relative flex justify-between backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 shadow-2xl">
            <span>User Management</span>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="w-48 pl-2 pr-10 py-1 border border-gray-300 rounded-md text-sm text-white 
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent"
                />

                <button
                  onClick={handleSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 
        p-1 rounded-md text-white hover:bg-white/30 transition"
                >
                  <Search size={14} />
                </button>
              </div>

              {filters.search && (
                <button
                  onClick={handleResetSearch}
                  className="px-2 py-1 text-xs backdrop-blur-xl bg-white/10 
      text-white rounded-md hover:bg-white/65 hover:text-black 
      cursor-pointer transition-all duration-300"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              <button
                onClick={handleAddUser}
                className="flex items-center gap-1 px-2 py-1 backdrop-blur-xl bg-white/10 text-white 
      rounded-md text-xs hover:bg-white/65 hover:text-black cursor-pointer transition-all duration-300"
              >
                <Plus size={14} />
                Add User
              </button>
            </div>
          </div>

          <div className="mt-6 backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/20 shadow-2xl">
            <Table
              data={users}
              columns={columns}
              loading={loading}
              emptyMessage="No users found"
            />

            {/* Reusable Pagination Component */}
            <TableControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="users"
            />
          </div>
        </section>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default UserManagement;
