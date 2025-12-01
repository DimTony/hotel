"use client";

import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Close modal on ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <span className="text-lg font-semibold text-white">{title}</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center backdrop-blur-xl bg-white/10 hover:bg-white/20 rounded-full p-1.5 cursor-pointer text-gray-300 hover:text-white transition-all duration-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
