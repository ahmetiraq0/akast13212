import React, { useState, useMemo, useEffect } from 'react';
import { Installment, Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentAmount: number) => void;
  product: Product;
  installment: Installment;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSave, product, installment }) => {
  const [amount, setAmount] = useState<number | string>('');
  const [error, setError] = useState('');
  const { settings } = useSettings();

  const installmentRemaining = useMemo(() => {
    return installment.amount - installment.amountPaid;
  }, [installment]);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    const paymentAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }
    if (paymentAmount > installmentRemaining) {
      setError(`المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المتبقي من القسط (${formatCurrency(installmentRemaining, settings.currency)}).`);
      return;
    }
    setError('');
    onSave(paymentAmount);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">تسجيل دفعة جديدة</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">للمنتج: {product.name}</p>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">مبلغ القسط الكلي</div>
                <div className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(installment.amount, settings.currency)}</div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">المبلغ المدفوع سابقاً</div>
                <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(installment.amountPaid, settings.currency)}</div>

                <div className="col-span-2 border-t dark:border-gray-700 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-md font-semibold text-gray-700 dark:text-gray-300">المتبقي من القسط:</span>
                    <span className="font-bold text-xl text-red-600 dark:text-red-400">{formatCurrency(installmentRemaining, settings.currency)}</span>
                </div>
            </div>
          </div>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}

          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ المدفوع الآن</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="paymentAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <button 
                onClick={() => setAmount(installmentRemaining)}
                className="text-sm text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 mt-2"
            >
                دفع المبلغ المتبقي بالكامل
            </button>
          </div>

        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-reverse space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
            <button type="button" onClick={handleSave} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">حفظ الدفعة</button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;