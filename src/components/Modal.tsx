import type { PropsWithChildren, ReactNode } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title?: ReactNode;
  onClose?: () => void;
}>;

export default function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg">
        {title ? <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 font-medium">{title}</div> : null}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}




