import React from 'react';
import { Customer, Product, InstallmentStatus } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useSettings, SettingsProvider } from '../contexts/SettingsContext';

const getStatusBadge = (status: InstallmentStatus, paidAt?: string) => {
    switch(status) {
        case 'paid':
            return (
                <div className="flex flex-col items-center">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">مدفوع بالكامل</span>
                    {paidAt && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(paidAt).toLocaleDateString('ar-IQ')}</span>}
                </div>
            );
        case 'partially_paid':
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">مدفوع جزئياً</span>;
        case 'unpaid':
        default:
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">غير مدفوع</span>;
    }
};

const CustomerPortalContent: React.FC<{ customer: Customer; product: Product }> = ({ customer, product }) => {
    const { settings } = useSettings();
    
    const paidAmount = product.downPayment + product.installments.reduce((sum, i) => sum + i.amountPaid, 0);
    const remainingAmount = product.totalPrice - paidAmount;
    const progress = product.totalPrice > 0 ? (paidAmount / product.totalPrice) * 100 : 0;
    const sortedInstallments = [...product.installments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen" id="portal-content">
            <header className="bg-white dark:bg-gray-800 shadow-sm print:hidden">
                <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">ملخص الأقساط</h1>
                    <p className="text-gray-600 dark:text-gray-400">مرحباً، {customer.fullName}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-b dark:border-gray-700 pb-4 mb-4">
                        {product.productPhoto && (
                            <img src={product.productPhoto} alt={product.name} className="h-24 w-24 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 text-center sm:text-right">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                تاريخ الشراء: {new Date(product.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-center">
                        <div><span className="block text-sm text-gray-500 dark:text-gray-400">السعر الكلي</span><span className="font-bold text-lg text-gray-800 dark:text-gray-200">{formatCurrency(product.totalPrice, settings.currency)}</span></div>
                        <div className="text-green-600 dark:text-green-400"><span className="block text-sm">المبلغ المدفوع</span><span className="font-bold text-lg">{formatCurrency(paidAmount, settings.currency)}</span></div>
                        <div className="text-red-600 dark:text-red-400"><span className="block text-sm">المبلغ المتبقي</span><span className="font-bold text-lg">{formatCurrency(remainingAmount, settings.currency)}</span></div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
                        <div className="bg-teal-600 h-3 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>

                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">جدول الأقساط ({product.installmentsCount})</h3>
                    <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-700">
                               <tr>
                                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تاريخ الاستحقاق</th>
                                   <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المبلغ</th>
                                   <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الحالة</th>
                               </tr>
                           </thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                               {sortedInstallments.map(installment => (
                                   <tr key={installment.id} className={installment.status === 'paid' ? 'bg-green-50/50 dark:bg-green-900/30' : installment.status === 'partially_paid' ? 'bg-yellow-50/50 dark:bg-yellow-900/30' : ''}>
                                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{new Date(installment.dueDate).toLocaleDateString('ar-IQ')}</td>
                                       <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(installment.amount, settings.currency)}</div>
                                            {installment.status === 'partially_paid' && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    المدفوع: {formatCurrency(installment.amountPaid, settings.currency)}
                                                </div>
                                            )}
                                        </td>
                                       <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{getStatusBadge(installment.status, installment.paidAt)}</td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <footer className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm print:hidden">
                <p>شكراً لتعاملكم معنا.</p>
            </footer>
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #portal-content, #portal-content * {
                        visibility: visible;
                    }
                    #portal-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        background-color: white;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    .shadow-md {
                        box-shadow: none !important;
                    }
                    .rounded-lg {
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

// Wrapper component to provide the SettingsContext
const CustomerPortal: React.FC<{ customer: Customer; product: Product }> = (props) => (
    <SettingsProvider>
        <CustomerPortalContent {...props} />
    </SettingsProvider>
);

export default CustomerPortal;