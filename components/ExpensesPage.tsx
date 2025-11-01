import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, PencilIcon, TrashIcon, DollarSignIcon, RepeatIcon, CalendarClockIcon } from './icons';

interface ExpensesPageProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const categoryMap: Record<ExpenseCategory, string> = {
  rent: 'إيجار',
  salaries: 'رواتب',
  bills: 'فواتير',
  supplies: 'مشتريات/بضاعة',
  marketing: 'تسويق',
  other: 'أخرى',
};

const ExpenseForm: React.FC<{ onSave: (data: Omit<Expense, 'id'|'createdAt'> | Expense) => void, onCancel: () => void, existingExpense?: Expense }> = ({ onSave, onCancel, existingExpense }) => {
    const isEditMode = !!existingExpense;
    const [description, setDescription] = useState(existingExpense?.description || '');
    const [amount, setAmount] = useState<number|string>(existingExpense?.amount || '');
    const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category || 'other');
    const [date, setDate] = useState(existingExpense?.date || new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(existingExpense?.isRecurring || false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(String(amount));
        if (!description.trim() || !numAmount || numAmount <= 0) {
            setError('الوصف والمبلغ حقول إلزامية، ويجب أن يكون المبلغ أكبر من صفر.');
            return;
        }

        const data = { description, amount: numAmount, category, date, isRecurring };
        if (isEditMode) {
            onSave({ ...existingExpense, ...data });
        } else {
            onSave(data);
        }
    };
    
    return (
        <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{isEditMode ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h3>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full input-style" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full input-style" required />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الفئة</label>
                        <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="mt-1 block w-full input-style">
                            {Object.entries(categoryMap).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ / تاريخ الاستحقاق</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full input-style" required />
                </div>
                <div className="flex items-center pt-2">
                    <input
                        id="isRecurring"
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="isRecurring" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                        مصروف متكرر (سيتم تذكيرك به شهرياً)
                    </label>
                </div>
                 <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
                    <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                    <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">{isEditMode ? 'حفظ التعديلات' : 'إضافة المصروف'}</button>
                </div>
            </form>
        </div>
    );
};

const Modal: React.FC<{onClose: () => void, children: React.ReactNode}> = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);


const ExpensesPage: React.FC<ExpensesPageProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const { settings } = useSettings();
  
  const handleOpenModal = (expense?: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setEditingExpense(undefined);
    setIsModalOpen(false);
  };
  
  const handleSave = (data: Omit<Expense, 'id'|'createdAt'> | Expense) => {
    if ('id' in data) {
        onUpdateExpense(data);
    } else {
        onAddExpense(data);
    }
    handleCloseModal();
  };
  
  const handlePostpone = (expense: Expense) => {
    const currentDate = new Date(expense.date);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const nextDueDate = currentDate.toISOString().split('T')[0];
    onUpdateExpense({ ...expense, date: nextDueDate });
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = useMemo(() => {
    const categoryTotals: { [key in ExpenseCategory]?: number } = {};
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category]! += expense.amount;
    });
    return Object.entries(categoryTotals)
        .map(([category, total]) => ({ category: category as ExpenseCategory, total: total as number }))
        .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {isModalOpen && (
          <Modal onClose={handleCloseModal}>
              <ExpenseForm onSave={handleSave} onCancel={handleCloseModal} existingExpense={editingExpense} />
          </Modal>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center">
                <DollarSignIcon className="w-8 h-8 text-red-500 ml-3" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">إدارة المصروفات</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">سجل وتتبع جميع مصروفاتك في مكان واحد.</p>
                </div>
            </div>
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center mt-4 sm:mt-0 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow">
                <PlusIcon className="h-5 w-5 ml-2" />
                <span>إضافة مصروف</span>
            </button>
        </div>
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-lg text-gray-600 dark:text-gray-300">إجمالي المصروفات المسجلة: <span className="font-bold text-red-600">{formatCurrency(totalExpenses, settings.currency)}</span></p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
                onClick={() => setViewMode('list')}
                className={`py-2 px-4 text-sm font-medium ${viewMode === 'list' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
                عرض الكل
            </button>
            <button
                onClick={() => setViewMode('summary')}
                className={`py-2 px-4 text-sm font-medium ${viewMode === 'summary' ? 'border-b-2 border-teal-500 text-teal-600 dark:text-teal-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
                ملخص حسب الفئة
            </button>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الوصف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المبلغ</th>
                  <th className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.length > 0 ? expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                            {expense.isRecurring && <RepeatIcon className="w-4 h-4 ml-2 text-blue-500" title="مصروف متكرر" />}
                            <span>{expense.description}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">{categoryMap[expense.category]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(expense.amount, settings.currency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-reverse space-x-2">
                        {expense.isRecurring && (
                            <button onClick={() => handlePostpone(expense)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="تأجيل للشهر القادم">
                                <CalendarClockIcon className="w-5 h-5" />
                            </button>
                        )}
                      <button onClick={() => handleOpenModal(expense)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300" title="تعديل"><PencilIcon className="w-5 h-5" /></button>
                      <button onClick={() => onDeleteExpense(expense.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">لم يتم تسجيل أي مصروفات بعد.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الفئة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المجموع</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expensesByCategory.map(({ category, total }) => (
                        <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{categoryMap[category]}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrency(total, settings.currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>
       <style>{`
            .input-style {
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                border-radius: 0.375rem;
                border-width: 1px;
                border-color: #D1D5DB;
                padding: 0.5rem 0.75rem;
                background-color: white;
            }
            .dark .input-style {
                border-color: #4B5563;
                background-color: #374151;
                color: #F9FAFB;
            }
            .input-style:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                --tw-ring-color: #0d9488;
                 border-color: #0d9488;
            }
        `}</style>
    </div>
  );
};

export default ExpensesPage;