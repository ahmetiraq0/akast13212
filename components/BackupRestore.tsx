import React, { useRef, useState } from 'react';
import { FileDownIcon, UploadIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

const BackupRestore: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modalState, setModalState] = useState({ isOpen: false, onConfirm: () => {} });

    const handleBackup = () => {
        const dataToBackup: { [key: string]: any } = {};
        const keysToBackup = ['customers', 'catalogProducts', 'expenses', 'appSettings', 'notificationSettings', 'dailyReminderLog', 'reminderHistory'];
        
        keysToBackup.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                dataToBackup[key] = JSON.parse(item);
            }
        });

        const jsonString = JSON.stringify(dataToBackup, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `installments-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not valid text.");
                
                const data = JSON.parse(text);
                
                // Basic validation
                if (!data.customers || !data.catalogProducts) {
                    throw new Error("الملف غير صالح أو لا يحتوي على البيانات المطلوبة.");
                }

                setModalState({
                    isOpen: true,
                    onConfirm: () => {
                        Object.keys(data).forEach(key => {
                            localStorage.setItem(key, JSON.stringify(data[key]));
                        });
                        alert("تمت استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة.");
                        window.location.reload();
                    }
                });

            } catch (error) {
                console.error("Error parsing backup file:", error);
                alert(`خطأ في استعادة البيانات: ${error instanceof Error ? error.message : 'ملف غير صالح'}`);
            } finally {
                // Reset file input to allow selecting the same file again
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({isOpen: false, onConfirm: ()=>{}})}
                onConfirm={modalState.onConfirm}
                title="تأكيد استعادة البيانات"
                message="تحذير! سيؤدي هذا الإجراء إلى الكتابة فوق جميع بياناتك الحالية بالبيانات الموجودة في ملف النسخ الاحتياطي. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد أنك تريد المتابعة؟"
                confirmButtonText="نعم، استعادة البيانات"
                confirmButtonClass="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">النسخ الاحتياطي والاستعادة</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
                قم بحماية بياناتك عن طريق إنشاء نسخة احتياطية أو استعادة بياناتك من ملف.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleBackup}
                    className="flex-1 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow"
                >
                    <FileDownIcon className="h-5 w-5 ml-2" />
                    <span>تصدير نسخة احتياطية</span>
                </button>
                <button
                    onClick={handleRestoreClick}
                    className="flex-1 flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow"
                >
                    <UploadIcon className="h-5 w-5 ml-2" />
                    <span>استعادة من ملف</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/json"
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default BackupRestore;
