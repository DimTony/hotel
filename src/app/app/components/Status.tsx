"use client";

import { useStore } from "@/store/store";
import Image from "next/image";
import React from "react";

export const StatusModal: React.FC = () => {
  const {
    isStatusModalOpen: isOpen,
    closeStatus: onClose,
    statusModalCurrentAction
  } = useStore();

  const icon = statusModalCurrentAction?.icon 
  const success = statusModalCurrentAction?.success 
  const title = statusModalCurrentAction?.title 
  const message = statusModalCurrentAction?.message; 
  const onButtonClick = statusModalCurrentAction?.onButtonClick;
  const buttonText = statusModalCurrentAction?.buttonText; 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-52 flex items-center justify-center bg-black/50">
      <div
        className={`backdrop-blur-xl relative rounded-lg shadow-lg w-full max-w-sm mx-4 overflow-hidden p-6 text-center
          ${
            success
              ? "bg-green-50/80 border border-green-200"
              : "bg-red-50/80 border border-red-200"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ICON */}
        <div className="mb-4 flex justify-center">
          {icon ? (
            typeof icon === "string" ? (
              <Image src={icon} width={80} height={80} alt="" />
            ) : (
              icon
            )
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                success
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {success ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* TITLE */}
        <span className="text-xl font-bold text-gray-900 mb-2">{title}</span>

        {/* MESSAGE */}
        {message && <p className="text-gray-700 mb-6">{message}</p>}

        {/* BUTTON */}

        <button
          onClick={onButtonClick || onClose}
          className="cursor-pointer w-full py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
