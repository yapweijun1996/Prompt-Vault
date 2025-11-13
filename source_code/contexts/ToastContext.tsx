import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastProps } from '../components/Toast';

type ToastData = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'warning') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
