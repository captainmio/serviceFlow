import { useEffect, useState, type ReactNode } from "react";

interface SlideOverPanelProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

const animationDurationMs = 220;

export const SlideOverPanel = ({
  isOpen,
  title,
  description,
  children,
  onClose
}: SlideOverPanelProps) => {
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
        onClick={onClose}
      />

      <section
        className={[
          "absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-white shadow-[-24px_0_80px_rgba(11,20,55,0.18)] transition-transform duration-200",
          isVisible ? "translate-x-0" : "translate-x-full"
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF2FF] px-6 py-5 sm:px-7">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#2B3674]">{title}</h2>
            {description ? <p className="mt-2 text-sm leading-6 text-[#707EAE]">{description}</p> : null}
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-[#707EAE] transition hover:bg-[#F4F7FE] hover:text-[#2B3674]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      </section>
    </div>
  );
};
