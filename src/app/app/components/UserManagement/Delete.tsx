"use client";

import React, { useState } from "react";
import { Modal } from "../Modal";
import { User } from "@/lib/types";



interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (identifier: number) => void | Promise<void>;
  title?: string;
  message?: string;
  user?: User | null;
  confirmText?: string;
  cancelText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  user,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {

    if (!user?.id) return

    setIsDeleting(true);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (error) {
      console.error("Error during deletion:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Warning Icon */}
        {/* <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div> */}

        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-gray-200">{message}</p>
          {user && <p className="text-white font-semibold">"{user?.firstName}"</p>}
          <p className="text-sm text-gray-400">This action cannot be undone.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            )}
            {isDeleting ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
