"use client";

import { createContext, useContext, useCallback, useState } from "react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 5000 }) => {
      const id = ++idCounter;
      setToasts((current) => [...current, { id, type, title, message }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (message, title = "Success") => showToast({ type: "success", title, message }),
    error: (message, title = "Error") => showToast({ type: "error", title, message, duration: 7000 }),
    info: (message, title = "") => showToast({ type: "info", title, message }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: { border: "border-green-900/60", bg: "bg-green-950/40", icon: "text-green-400", title: "text-green-300" },
    error: { border: "border-red-900/60", bg: "bg-red-950/40", icon: "text-red-400", title: "text-red-300" },
    info: { border: "border-slate-700", bg: "bg-slate-900", icon: "text-blue-400", title: "text-slate-200" },
  }[toast.type];

  // message can be a string OR an array of lines (e.g. validation errors) — fixes the mangled alert() list
  const lines = Array.isArray(toast.message) ? toast.message : [toast.message];

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 shadow-lg backdrop-blur`} role="alert">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 ${styles.icon}`}>
          {toast.type === "success" && "✓"}
          {toast.type === "error" && "⚠"}
          {toast.type === "info" && "ℹ"}
        </span>

        <div className="min-w-0 flex-1">
          {toast.title && <p className={`text-sm font-semibold ${styles.title}`}>{toast.title}</p>}
          <div className="mt-1 space-y-1 text-sm text-slate-300">
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <button onClick={onDismiss} className="shrink-0 text-slate-500 hover:text-slate-300" aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}