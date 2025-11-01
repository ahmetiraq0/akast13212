import React, { useState } from 'react';
import { Installment } from '../types';

interface InstallmentFormProps {
  onAddInstallment: (installment: Omit<Installment, 'id' | 'status' | 'paidAt'>) => void;
  onCancel: () => void;
}

const InstallmentForm: React.FC<InstallmentFormProps> = ({ onAddInstallment, onCancel }) => {
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر.');
      return;
    }
    if (!dueDate) {
        setError('تاريخ الاستحقاق حقل إلزامي.');
        return;
    }
    setError('');
    onAddInstallment({
      amount,
      dueDate,
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mt-4 border-t-2 border-dashed border-teal-500">
      <h4 className="font-bold mb-2 text-gray-700 dark:text-gray-200">إضافة قسط جديد</h4>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label htmlFor="installmentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ</label>
          <input
            type="number"
            id="installmentAmount"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
            min="0.01"
            step="0.01"
          />
        </div>
        <div className="flex-1 w-full">
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الاستحقاق</label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div className="flex items-center space-x-reverse space-x-2 mt-2 sm:mt-0 pt-5">
          <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">حفظ القسط</button>
        </div>
      </form>
    </div>
  );
};

export default InstallmentForm;