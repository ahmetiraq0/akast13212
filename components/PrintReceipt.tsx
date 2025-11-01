import React from 'react';
import { Customer, Product, ShopInfo } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';

interface PrintReceiptProps {
  customer: Customer;
  product: Product;
  shopInfo: ShopInfo;
  onBack: () => void;
}

const PrintReceipt: React.FC<PrintReceiptProps> = ({ customer, product, shopInfo, onBack }) => {
  const { settings, playSound } = useSettings();
  const paidAmount = product.downPayment + product.installments.reduce((sum, i) => sum + i.amountPaid, 0);
  const remainingAmount = product.totalPrice - paidAmount;

  const handlePrint = () => {
    playSound('print');
    window.print();
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg" id="receipt">
            <header className="flex justify-between items-center border-b dark:border-gray-700 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    {shopInfo.logo && <img src={shopInfo.logo} alt="شعار المحل" className="h-16 w-16 object-contain" />}
                    <div>
                        <h1 className="text-3xl font-bold text-teal-600 dark:text-teal-400">{shopInfo.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{shopInfo.address}</p>
                        <p className="text-gray-500 dark:text-gray-400">{shopInfo.phone}</p>
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">وصل استلام</h2>
                    <p className="text-gray-500 dark:text-gray-400">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            </header>

            <section className="mb-6">
                <h3 className="text-xl font-bold border-b dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-gray-100">بيانات الزبون</h3>
                <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                    <p><strong>الاسم:</strong> {customer.fullName}</p>
                    <p><strong>الهاتف:</strong> {customer.phone}</p>
                    <p><strong>العنوان:</strong> {customer.address}</p>
                </div>
            </section>

            <section className="mb-6">
                <h3 className="text-xl font-bold border-b dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-gray-100">تفاصيل المنتج</h3>
                <div className="grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
                    <p><strong>المنتج:</strong> {product.name}</p>
                    <p><strong>السعر الكلي:</strong> {formatCurrency(product.totalPrice, settings.currency)}</p>
                    <p><strong>المقدّم:</strong> {formatCurrency(product.downPayment, settings.currency)}</p>
                    <p><strong>عدد الأقساط:</strong> {product.installmentsCount}</p>
                </div>
            </section>

            <section className="mb-6">
                <h3 className="text-xl font-bold border-b dark:border-gray-700 pb-2 mb-4 text-gray-800 dark:text-gray-100">جدول الأقساط</h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border dark:border-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">تاريخ الاستحقاق</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">المبلغ</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                        {product.installments.map(installment => (
                            <tr key={installment.id}>
                                <td className="px-4 py-2">{new Date(installment.dueDate).toLocaleDateString('ar-EG')}</td>
                                <td className="px-4 py-2">{formatCurrency(installment.amount, settings.currency)}</td>
                                <td className="px-4 py-2">{installment.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <section className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">الملخص المالي</h3>
                <div className="flex justify-around">
                    <div className="text-center"><span className="block text-gray-600 dark:text-gray-400">الإجمالي</span><strong className="text-lg text-gray-800 dark:text-gray-200">{formatCurrency(product.totalPrice, settings.currency)}</strong></div>
                    <div className="text-center"><span className="block text-gray-600 dark:text-gray-400">المدفوع</span><strong className="text-lg text-green-600 dark:text-green-400">{formatCurrency(paidAmount, settings.currency)}</strong></div>
                    <div className="text-center"><span className="block text-gray-600 dark:text-gray-400">المتبقي</span><strong className="text-lg text-red-600 dark:text-red-400">{formatCurrency(remainingAmount, settings.currency)}</strong></div>
                </div>
            </section>

            <footer className="mt-12 pt-6 border-t dark:border-gray-700">
                <div className="flex justify-between text-gray-800 dark:text-gray-200">
                    <div className="text-center">
                        <p className="font-bold">توقيع البائع</p>
                        <p className="mt-8 border-t border-gray-400 w-48">....................</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold">توقيع الزبون</p>
                        <p className="mt-8 border-t border-gray-400 w-48">....................</p>
                    </div>
                </div>
            </footer>
        </div>
        
        <div className="max-w-4xl mx-auto mt-6 flex justify-end space-x-reverse space-x-3 print:hidden">
            <button onClick={onBack} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                رجوع
            </button>
            <button onClick={handlePrint} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                طباعة
            </button>
        </div>
         <style>{`
            @media print {
                body * {
                    visibility: hidden;
                }
                #receipt, #receipt * {
                    visibility: visible;
                }
                #receipt {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
            }
        `}</style>
    </div>
  );
};

export default PrintReceipt;