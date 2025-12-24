"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((type: ToastType, message: string) => {
    // 🔥 FIX 1: Use guaranteed unique ID
    const id = crypto.randomUUID();

    setToasts((prev) => [...prev, { id, message, type }]);

    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const contextValue = {
    toast: {
      success: (msg: string) => pushToast("success", msg),
      error: (msg: string) => pushToast("error", msg),
      info: (msg: string) => pushToast("info", msg),
    },
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] space-y-3 
                      w-full flex flex-col items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg border pointer-events-auto
              animate-slide-in
              ${
                t.type === "success"
                  ? "bg-green-900/40 border-green-600 text-green-300"
                  : t.type === "error"
                  ? "bg-red-900/40 border-red-600 text-red-300"
                  : "bg-blue-900/40 border-blue-600 text-blue-300"
              }
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}