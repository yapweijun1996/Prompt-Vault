
import React from 'react';
import { CloseIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <div className="flex justify-between items-center mb-4">
          <h2 id="confirmation-title" className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>
        
        <p className="text-slate-300 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
