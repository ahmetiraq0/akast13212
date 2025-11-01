import React from 'react';
import { DailyReminderLogItem } from '../types';
import { BellIcon } from './icons';

interface TodaysRemindersProps {
  reminders: DailyReminderLogItem[];
}

const TodaysReminders: React.FC<TodaysRemindersProps> = ({ reminders }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <BellIcon className="w-6 h-6 text-teal-600 dark:text-teal-400 ml-3" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">التذكيرات التلقائية المرسلة اليوم ({reminders.length})</h2>
      </div>
      {reminders.length > 0 ? (
        <div className="overflow-x-auto max-h-64">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الزبون</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المنتج</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">وقت الإرسال</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reminders.map((reminder, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{reminder.customerName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{reminder.productName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(reminder.sentAt).toLocaleTimeString('ar-IQ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">لم يتم إرسال أي تذكيرات تلقائية اليوم.</p>
      )}
    </div>
  );
};

export default TodaysReminders;