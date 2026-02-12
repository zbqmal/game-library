import { useEffect } from "react";

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
  autoDismiss?: boolean;
  duration?: number;
}

export default function ErrorToast({
  message,
  onDismiss,
  autoDismiss = true,
  duration = 5000,
}: ErrorToastProps) {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
        <span className="text-xl">⚠️</span>
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="text-white hover:text-red-100 font-bold text-xl leading-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}
