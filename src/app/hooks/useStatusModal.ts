// import { useState } from "react";

// export const useStatusModal = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [success, setSuccess] = useState(true);
//   const [title, setTitle] = useState("");
//   const [message, setMessage] = useState("");
//   const [icon, setIcon] = useState<string | React.ReactNode | undefined>();
//   const [buttonText, setButtonText] = useState("Close");
//   const [callback, setCallback] = useState<(() => void) | undefined>();

//   const showStatus = (options: {
//     success: boolean;
//     title: string;
//     message?: string;
//     icon?: string | React.ReactNode;
//     buttonText?: string;
//     onButtonClick?: () => void;
//   }) => {
//     setSuccess(options.success);
//     setTitle(options.title);
//     setMessage(options.message || "");
//     setIcon(options.icon);
//     setButtonText(options.buttonText || "Close");
//     setCallback(() => options.onButtonClick);
//     setIsOpen(true);
//   };

//   const closeStatus = () => {
//     setIsOpen(false);
//   };

//   return {
//     isOpen,
//     success,
//     title,
//     message,
//     icon,
//     buttonText,
//     onButtonClick: callback,
//     showStatus,
//     closeStatus,
//   };
// };


import { useStore } from "@/store/store";
import { useState } from "react";

export const useStatusModal = () => {
  const {
    isStatusModalOpen,
    statusModalCurrentAction,
    showStatus,
    closeStatus,
  } = useStore();

  return {
    isStatusModalOpen,
    isStatusSuccess: statusModalCurrentAction?.success || false,
    statusTitle: statusModalCurrentAction?.title || "",
    message: statusModalCurrentAction?.message || "",
    icon: statusModalCurrentAction?.icon || "",
    buttonText: statusModalCurrentAction?.buttonText || "",
    onButtonClick: statusModalCurrentAction?.onButtonClick || undefined,
    showStatus,
    closeStatus,
  };
};
