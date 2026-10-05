import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-slate-900/95 text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    error: {
      border: 'border-rose-500/30',
      bg: 'bg-slate-900/95 text-rose-300',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    info: {
      border: 'border-brand-500/30',
      bg: 'bg-slate-900/95 text-brand-300',
      icon: Info,
      iconColor: 'text-brand-400',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border ${config.border} ${config.bg} shadow-xl backdrop-blur-md animate-slide-up text-xs font-medium`}
    >
      <div className="flex items-center space-x-2.5 mr-3">
        <Icon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
        <span className="text-slate-200">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-md"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
