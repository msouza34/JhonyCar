import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  children?: ReactNode;
}

export default function Modal({
  isOpen,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Salvar",
  confirmVariant = "primary",
  loading,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    overlayRef.current?.scrollTo({ top: 0, behavior: "auto" });
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div ref={overlayRef} className="fixed inset-0 z-50 overflow-y-auto bg-[#020610]/70 p-3 backdrop-blur-md">
      <div className="flex min-h-full items-start justify-center py-2 sm:py-4">
        <div className="flex w-full max-w-2xl max-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(9,24,50,0.98),rgba(5,14,30,0.98))] p-5 shadow-[0_20px_45px_rgba(2,8,20,0.55)]">
          <div className="mb-3 shrink-0">
            <h2 className="font-title text-lg font-semibold text-slate-50">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-slate-300">{description}</p> : null}
          </div>

          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
            {children}
          </div>

          <div className="mt-5 flex shrink-0 justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            {onConfirm ? (
              <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
