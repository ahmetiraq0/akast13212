import React from 'react';
import { User } from '../types';
import { AlertTriangleIcon, ClipboardIcon, CheckCircleIcon, LogOutIcon } from './icons';

interface TrialExpiredProps {
    user: User;
    onLogout: () => void;
}

const TrialExpired: React.FC<TrialExpiredProps> = ({ user, onLogout }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                    <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">انتهت فترة التجربة</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    انتهت فترة التجربة الخاصة بحسابك. لاستمرار استخدام البرنامج، يرجى التواصل مع الإدارة لتفعيل حسابك بشكل دائم.
                </p>
                <div className="mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-300">قم بتزويد الإدارة بالمعرف الخاص بك (UID) للتفعيل:</p>
                    <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                        <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono truncate">{user.id}</pre>
                        <button
                            onClick={handleCopy}
                            className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                            title="نسخ المعرف"
                        >
                            {copied ? <CheckCircleIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <div className="mt-8">
                     <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow"
                    >
                        <LogOutIcon className="w-5 h-5 ml-2" />
                        <span>العودة إلى صفحة الدخول</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrialExpired;