import { useStore } from "@/store/store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const ModalOverlay: React.FC<{
  children: ReactNode;
  onClose?: () => void;
  disableOutsideClick?: boolean;
}> = ({ children }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-51 flex items-center justify-center bg-black/50">
      <div
        className=" backdrop-blur-xl bg-white/60 relative rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-[4.5%] left-[2.1%]">
          {/* <Image
            src="/images/bg-pattern.svg"
            alt="info"
            width={120}
            height={120}
          /> */}
        </div>
        {children}
      </div>
    </div>
  );
};

const ModalHeader: React.FC<{
  icon?: string | ReactNode;
  onClose: () => void;
}> = ({ icon, onClose }) => {
  return (
    <div className="flex items-center justify-between px-4 pt-4 ">
      <div className="flex items-center gap-3">
        {icon &&
          (typeof icon === "string" ? (
            <Image src={icon} width={24} height={24} alt="" />
          ) : (
            icon
          ))}
      </div>
      <button
        onClick={() => {
          onClose();
        }}
        className="p-1 rounded-full hover:bg-gray-100"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

const Button: React.FC<{
  children: ReactNode;
  variant?: "primary" | "outline";
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
}> = ({
  children,
  variant = "primary",
  disabled = false,
  onClick,
  fullWidth = false,
  className = "",
}) => {
  const baseStyles =
    "cursor-pointer px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles =
    variant === "primary"
      ? "bg-gray-600 text-white hover:bg-gray-700 focus:ring-blue-500"
      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-blue-500";
  const widthStyles = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${widthStyles} ${disabledStyles} ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin w-10 h-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
);

export const ConfirmationModal: React.FC = () => {
  const router = useRouter();
  const {
    isOpen,
    stage,
    currentAction,
    actionResult,
    closeModal,
    handleConfirm,
    handleResultAction,
    goBack,
    rejectReason,
  } = useStore();

  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (isOpen && currentAction) {
      if (currentAction.title === "Provide Rejection Reason") {
        setIsValid(rejectReason.trim().length > 0);
      } else {
        setIsValid(true);
      }
    }
  }, [isOpen, currentAction, rejectReason]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (stage) {
      case "confirmation":
        return (
          <>
            <ModalHeader icon={currentAction?.icon} onClose={closeModal} />

            <div className="p-4">
              <span className="text-xl font-semibold">{currentAction?.title}</span>

              {currentAction?.description && (
                <div className="mb-4 text-xs text-white">
                  {currentAction.description}
                </div>
              )}

              {currentAction?.detailsComponent && (
                <div className="mb-4">
                  {typeof currentAction.detailsComponent === "function"
                    ? (() => {
                        const Component =
                          currentAction.detailsComponent as React.ComponentType<any>;
                        return (
                          <Component
                            setIsValid={(valid: any) => {
                              setIsValid(valid);
                            }}
                          />
                        );
                      })()
                    : currentAction.detailsComponent}
                </div>
              )}

              <div className="flex justify-between gap-2 mt-4">
                <Button
                  className="w-[48%]"
                  variant="outline"
                  onClick={() => {
                    if (currentAction?.previousAction) {
                      if (goBack) {
                        goBack();
                      }
                    } else {
                      closeModal();
                    }
                  }}
                >
                  {currentAction?.previousAction
                    ? currentAction?.backText || "Back"
                    : currentAction?.cancelText || "Cancel"}
                </Button>
                <Button
                  className="w-[48%]"
                  onClick={() => {
                    if (
                      currentAction?.title === "Provide Rejection Reason" &&
                      (!rejectReason || rejectReason.trim() === "")
                    ) {
                      setIsValid(false);
                      return;
                    }

                    handleConfirm();
                  }}
                  disabled={!isValid}
                >
                  {currentAction?.confirmText || "Confirm"}
                </Button>
              </div>
            </div>
          </>
        );

      case "loading":
        return (
          <div className="p-8 flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        );

      case "result":
        return (
          <div className="p-6 flex flex-col items-center text-center">
            <div className="mb-4">
              {actionResult?.icon ? (
                typeof actionResult.icon === "string" ? (
                  <Image
                    src={actionResult.icon}
                    width={80}
                    height={80}
                    alt={actionResult?.success ? "Success" : "Error"}
                  />
                ) : (
                  actionResult.icon
                )
              ) : (
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    actionResult?.success
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {actionResult?.success ? (
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
            <h3 className="text-xl font-bold mb-6">
              {actionResult?.displayText}
            </h3>
            <Button
              onClick={() => {
                if (actionResult?.redirectPath) {
                  router.push(actionResult.redirectPath);
                  closeModal();
                } else {
                  handleResultAction();
                }
              }}
              fullWidth
            >
              {actionResult?.buttonText || "Close"}
            </Button>
          </div>
        );
    }
  };

  return (
    <ModalOverlay onClose={stage !== "loading" ? closeModal : undefined}>
      {renderContent()}
    </ModalOverlay>
  );
};
