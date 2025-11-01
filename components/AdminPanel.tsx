import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';
import { ShieldCheckIcon, CheckCircleIcon, AlertTriangleIcon, TrashIcon } from './icons';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AdminPanelProps {
    onShowConfirmation: (modalState: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmButtonText?: string;
        confirmButtonClass?: string;
    }) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onShowConfirmation }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const usersCollectionRef = collection(db, "users");
            const userSnapshot = await getDocs(usersCollectionRef);
            const userList = userSnapshot.docs.map(doc => doc.data() as User);
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleUserActivation = async (userId: string, currentStatus: boolean) => {
        const userDocRef = doc(db, "users", userId);
        try {
            await updateDoc(userDocRef, { isActive: !currentStatus });
            // Update local state for immediate UI feedback
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, isActive: !currentStatus } : user
                )
            );
        } catch (error) {
            console.error("Error updating user status: ", error);
            alert("حدث خطأ أثناء تحديث حالة المستخدم.");
        }
    };

    const handleDeleteUser = (userToDelete: User) => {
        onShowConfirmation({
            isOpen: true,
            title: `حذف المستخدم ${userToDelete.email}`,
            message: `هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف بياناته بشكل دائم. (هذا لا يحذف حساب الدخول، فقط الملف الشخصي)`,
            onConfirm: async () => {
                try {
                    const userDocRef = doc(db, "users", userToDelete.id);
                    await deleteDoc(userDocRef);
                    setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
                } catch (error) {
                    console.error("Error deleting user document: ", error);
                    alert("حدث خطأ أثناء حذف المستخدم.");
                }
            },
            confirmButtonText: 'نعم، قم بالحذف',
            confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        });
    };

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            if (a.role === 'admin') return -1;
            if (b.role === 'admin') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [users]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                <ShieldCheckIcon className="w-10 h-10 text-teal-600 dark:text-teal-400 ml-4" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">لوحة تحكم الإدارة</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">إدارة المستخدمين وتفعيل الحسابات.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">قائمة المستخدمين ({users.length})</h2>
                {isLoading ? <p>جاري تحميل المستخدمين...</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">البريد/اسم المستخدم</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المعرف (UID)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الحالة</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تاريخ التسجيل</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedUsers.map(user => {
                                    const isTrialExpired = new Date() > new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
                                    return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</div>
                                            {user.role === 'admin' && <span className="text-xs text-teal-600 dark:text-teal-400">إدمن</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            {user.isActive ? (
                                                <span className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                                    <CheckCircleIcon className="w-4 h-4" /> نشط
                                                </span>
                                            ) : isTrialExpired ? (
                                                <span className="flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                                    <AlertTriangleIcon className="w-4 h-4" /> تجربة منتهية
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                                    فترة تجريبية
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString('ar-IQ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {user.role !== 'admin' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    {user.isActive ? (
                                                        <button
                                                            onClick={() => handleToggleUserActivation(user.id, user.isActive)}
                                                            className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition-colors text-xs"
                                                        >
                                                            إلغاء التفعيل
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleUserActivation(user.id, user.isActive)}
                                                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-xs"
                                                        >
                                                            تفعيل
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                                                        title="حذف المستخدم"
                                                    >
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
