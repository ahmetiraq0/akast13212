import React, { useEffect, useState } from 'react';
import { Customer, Product, Installment, DailyReminderLog, DailyReminderLogItem } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { generateWhatsAppReminderUrl } from '../utils/whatsappHelper';

interface ReminderManagerProps {
    customers: Customer[];
    setModalState: (state: any) => void;
    showToast: (message: string) => void;
    dailyReminderLog: DailyReminderLog;
    setDailyReminderLog: (value: DailyReminderLog | ((val: DailyReminderLog) => DailyReminderLog)) => void;
}

const ReminderManager: React.FC<ReminderManagerProps> = ({ customers, setModalState, showToast, dailyReminderLog, setDailyReminderLog }) => {
    const { settings } = useSettings();
    const [reminderHistory, setReminderHistory] = useLocalStorage<{[installmentId: string]: string}>('reminderHistory', {});
    const [hasChecked, setHasChecked] = useState(false);
    
    useEffect(() => {
        if (customers.length === 0 || hasChecked) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        if (dailyReminderLog.date !== today) {
            setDailyReminderLog({ date: today, reminders: [] });
        }

        const remindersToSend: {customer: Customer, product: Product, installment: Installment}[] = [];
        const now = new Date().getTime();

        customers.forEach(customer => {
            customer.products.forEach(product => {
                product.installments.forEach(installment => {
                    if (installment.status === 'unpaid' || installment.status === 'partially_paid') {
                        const dueDate = new Date(installment.dueDate).getTime();
                        if (now > dueDate) {
                            const lastReminderTime = reminderHistory[installment.id] ? new Date(reminderHistory[installment.id]).getTime() : 0;
                            const twentyFourHours = 24 * 60 * 60 * 1000;

                            if (!lastReminderTime || (now - lastReminderTime > twentyFourHours)) {
                                remindersToSend.push({ customer, product, installment });
                            }
                        }
                    }
                });
            });
        });
        
        if (remindersToSend.length > 0) {
            setModalState({
                isOpen: true,
                title: 'تنبيهات الأقساط المستحقة',
                message: `يوجد ${remindersToSend.length} قسط مستحق الدفع. هل ترغب بإرسال رسائل تذكير عبر واتساب الآن؟`,
                onConfirm: () => processReminderQueue(remindersToSend),
                confirmButtonText: `نعم، إرسال (${remindersToSend.length})`,
                confirmButtonClass: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
            });
        }
        setHasChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customers, hasChecked]);

    const processReminderQueue = async (reminders: {customer: Customer, product: Product, installment: Installment}[]) => {
      const newHistory = { ...reminderHistory };
      const newLogItems: DailyReminderLogItem[] = [];
      const nowISO = new Date().toISOString();

      for (const item of reminders) {
          const { customer, product, installment } = item;
          const url = generateWhatsAppReminderUrl(customer, product, installment, settings.currency);
          window.open(url, '_blank');
          
          newHistory[installment.id] = nowISO;
          newLogItems.push({
              customerId: customer.id,
              customerName: customer.fullName,
              productName: product.name,
              sentAt: nowISO
          });

          await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setReminderHistory(newHistory);
      setDailyReminderLog(prev => ({
          ...prev,
          reminders: [...prev.reminders, ...newLogItems]
      }));
      showToast(`تم إرسال ${reminders.length} تذكير عبر واتساب.`);
    };

    return null; // This component does not render anything
}

export default ReminderManager;