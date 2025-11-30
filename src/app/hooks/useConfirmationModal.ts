import { useStore } from "@/store/store";

export const useConfirmationModal = () => {
  const { openModal, closeModal, isOpen, stage, currentAction, actionResult } =
    useStore();

  return {
    isOpen,
    stage,
    openConfirmationModal: openModal,
    closeModal,
    modalProps: {
      title: currentAction?.title || "",
      description: currentAction?.description || "",
      icon: currentAction?.icon || "",
      cancelText: currentAction?.cancelText,
      confirmText: currentAction?.confirmText,
    },
    resultProps: {
      isSuccess: actionResult?.success ?? false,
      displayText: actionResult?.displayText ?? "",
      buttonText: actionResult?.buttonText ?? "",
      icon: actionResult?.icon || "",
    },
  };
};
