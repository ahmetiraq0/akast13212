import React from 'react';
import { CheckCircleIcon } from './icons';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  return (
    <div
      aria-live="assertive"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'}`}
    >
      <div className="flex items-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-bold px-4 py-3 rounded-lg shadow-lg" role="alert">
        <CheckCircleIcon className="w-5 h-5 ml-2 text-green-400 dark:text-green-600" />
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Toast;
