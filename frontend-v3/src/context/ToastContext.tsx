import {
  createContext, useContext, useState,
  useCallback, useRef, type ReactNode,
} from 'react';

export type ToastType = 'xp' | 'badge' | 'level-up' | 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  xp:       { bg: '#f0f7f6', border: '#6caba0', text: '#4d8a80' },
  badge:    { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' },
  'level-up': { bg: '#f5f3ff', border: '#8b5cf6', text: '#7c3aed' },
  success:  { bg: '#e8f5e9', border: '#4caf50', text: '#388e3c' },
  error:    { bg: '#ffebee', border: '#ef5350', text: '#c62828' },
  info:     { bg: '#e3f2fd', border: '#42a5f5', text: '#1565c0' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'xp') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 3000);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3350);
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const c = TOAST_COLORS[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto max-w-xs px-4 py-3 rounded-2xl text-sm font-semibold shadow-elevated"
              style={{
                background: c.bg,
                border: `2px solid ${c.border}`,
                color: c.text,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                animation: toast.exiting
                  ? 'toastOut 0.35s ease forwards'
                  : 'toastSlide 0.35s ease',
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải dùng trong ToastProvider');
  return ctx;
}
