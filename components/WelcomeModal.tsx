import React, { useState } from 'react';
import { User } from '../types';
import { CheckCircleIcon, ClipboardIcon } from './icons';

interface WelcomeModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, user, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !user) return null;

    const handleCopy = () => {
        if (user) {
            navigator.clipboard.writeText(user.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full mx-4">
                <div className="p-6 text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 sm:mx-auto sm:h-10 sm:w-10">
                        <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                            تم إنشاء حسابك بنجاح!
                        </h3>
                        <div className="mt-4 space-y-3 text-gray-600 dark:text-gray-300">
                            <p>
                                مرحباً بك في برنامج إدارة الأقساط. حسابك الآن في <span className="font-bold text-teal-600 dark:text-teal-400">فترة تجريبية مجانية لمدة 30 يوماً</span>.
                            </p>
                            <p>
                                بعد انتهاء الفترة التجريبية، ستحتاج إلى تفعيل حسابك للاستمرار. يرجى الاحتفاظ بالمعرف الخاص بك (UID) لغرض التفعيل.
                            </p>
                        </div>
                        <div className="mt-5">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">المعرف الخاص بك (UID):</p>
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
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex justify-center">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        متابعة وبدء الاستخدام
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
