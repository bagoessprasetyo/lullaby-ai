// Adapted from shadcn/ui toast component
import { useState, useEffect } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type Toast = {
  id: string;
  props: ToastProps;
  visible: boolean;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [
      ...prev,
      {
        id,
        props,
        visible: true,
      },
    ]);

    // Auto dismiss after duration
    if (props.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, props.duration || 5000);
    }

    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  };

  // Render toast UI using useEffect and portals in actual implementation
  useEffect(() => {
    if (toasts.length > 0) {
      // This would normally create a portal and render the toast UI
      // For our purposes, we'll just log to console
      console.log("Toast shown:", toasts[toasts.length - 1].props);
    }
  }, [toasts]);

  return { toast, dismissToast, toasts };
}