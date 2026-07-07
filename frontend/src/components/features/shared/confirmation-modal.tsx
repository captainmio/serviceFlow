import { useEffect, useState } from "react";
import { Button } from "../../ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

const animationDurationMs = 220;

export const ConfirmationModal = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  isConfirming = false,
  onCancel,
  onConfirm
}: ConfirmationModalProps) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, animationDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={[
          "absolute inset-0 bg-[#0B1437]/35 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        ].join(" ")}
        onClick={onCancel}
      />

      <section
        className={[
          "absolute left-1/2 top-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_80px_rgba(11,20,55,0.18)] transition-all duration-200",
          isVisible ? "-translate-y-1/2 opacity-100" : "translate-y-[-45%] opacity-0"
        ].join(" ")}
      >
        <h2 className="text-xl font-bold text-[#2B3674]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#707EAE]">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <Button
            className={tone === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : ""}
            type="button"
            disabled={isConfirming}
            onClick={() => void onConfirm()}
          >
            {isConfirming ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
};
