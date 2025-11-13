import React, { useEffect, useState } from 'react';
import { CloseIcon } from './icons';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error';
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-300',
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-300',
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-300',
  },
};

const Toast: React.FC<ToastProps> = ({ id, message, type = 'warning', onClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const styles = toastConfig[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => onClose(id), 300); // Wait for fade-out animation
  };

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm p-4 mb-4 rounded-lg border ${styles.bg} ${styles.border} ${styles.text} shadow-lg transition-all duration-300 ease-in-out transform ${isFadingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
    >
      <div className="flex items-start">
        <p className="text-sm font-medium mr-4">{message}</p>
        <button
          onClick={handleClose}
          className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700 focus:ring-2 focus:ring-slate-600"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default Toast;
