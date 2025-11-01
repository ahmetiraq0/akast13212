// FIX: Import React to use React.FC type.
import React, { useEffect } from 'react';
import { Expense } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/formatters';

interface ExpenseNotifierProps {
  expenses: Expense[];
  showToast: (message: string) => void;
}

const ExpenseNotifier: React.FC<ExpenseNotifierProps> = ({ expenses, showToast }) => {
    const { settings } = useSettings();
    const [notifiedThresholds, setNotifiedThresholds] = useLocalStorage<Record<string, boolean>>('expenseThresholdNotified', {});
    const [notifiedRecurring, setNotifiedRecurring] = useLocalStorage<Record<string, boolean>>('recurringExpenseNotified', {});

    useEffect(() => {
        // --- Threshold Check ---
        if (settings.expenseThresholdEnabled && settings.expenseThresholdAmount > 0) {
            const now = new Date();
            const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
            
            if (!notifiedThresholds[currentMonthKey]) {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const monthlyExpenses = expenses.filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate >= startOfMonth && expDate <= endOfMonth;
                });

                const totalMonthlyExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                if (totalMonthlyExpenses > settings.expenseThresholdAmount) {
                    showToast(`تنبيه: مصروفات هذا الشهر تجاوزت ${formatCurrency(settings.expenseThresholdAmount, settings.currency)}`);
                    setNotifiedThresholds(prev => ({...prev, [currentMonthKey]: true}));
                }
            }
        }

        // --- Recurring Expense Check ---
        if (settings.recurringExpenseReminderEnabled) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const recurringExpenses = expenses.filter(exp => exp.isRecurring);

            recurringExpenses.forEach(exp => {
                const dueDate = new Date(exp.date);
                dueDate.setHours(0, 0, 0, 0);

                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays <= settings.recurringExpenseReminderDays) {
                    const notificationKey = `${exp.id}_${exp.date}`;
                    if (!notifiedRecurring[notificationKey]) {
                        const dueText = diffDays === 0 ? 'اليوم' : `خلال ${diffDays} أيام`;
                        showToast(`تذكير بمصروف: "${exp.description}" مستحق ${dueText}`);
                        setNotifiedRecurring(prev => ({...prev, [notificationKey]: true}));
                    }
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, settings]);


    return null; // This component does not render UI
};

export default ExpenseNotifier;