import React, { useState, useMemo } from 'react';
import { Customer, Installment } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { formatCurrency } from '../utils/formatters';
import { BellIcon, AlertTriangleIcon, CalendarClockIcon, SettingsIcon, ChevronLeftIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface NotificationBellProps {
  customers: Customer[];
}

interface UpcomingInstallment {
  type: 'upcoming';
  customerName: string;
  productName: string;
  installment: Installment;
  daysUntilDue: number;
}

interface OverdueInstallment {
  type: 'overdue';
  customerName: string;
  productName: string;
  installment: Installment;
  daysOverdue: number;
}

type NotificationItem = UpcomingInstallment | OverdueInstallment;

interface NotificationSettings {
  showOverdue: boolean;
  showUpcoming: boolean;
  upcomingDaysThreshold: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ customers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsView, setShowSettingsView] = useState(false);
  const { settings: appSettings } = useSettings();
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notificationSettings', {
    showOverdue: true,
    showUpcoming: true,
    upcomingDaysThreshold: 3,
  });


  const notifications = useMemo<NotificationItem[]>(() => {
    const upcoming: UpcomingInstallment[] = [];
    const overdue: OverdueInstallment[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    customers.forEach(customer => {
      customer.products.forEach(product => {
        product.installments.forEach(installment => {
          if (installment.status === 'unpaid') {
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (settings.showOverdue && diffDays < 0) { // Overdue
              overdue.push({
                type: 'overdue',
                customerName: customer.fullName,
                productName: product.name,
                installment,
                daysOverdue: Math.abs(diffDays),
              });
            } else if (settings.showUpcoming && diffDays >= 0 && diffDays <= settings.upcomingDaysThreshold) { // Upcoming
              upcoming.push({
                type: 'upcoming',
                customerName: customer.fullName,
                productName: product.name,
                installment,
                daysUntilDue: diffDays,
              });
            }
          }
        });
      });
    });
    
    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
    upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return [...overdue, ...upcoming];
  }, [customers, settings]);

  const getUpcomingDaysText = (days: number) => {
    if (days === 0) return 'اليوم';
    if (days === 1) return 'غداً';
    return `خلال ${days} أيام`;
  };

  const getOverdueDaysText = (days: number) => {
    if (days === 1) return 'متأخر منذ يوم';
    if (days === 2) return 'متأخر منذ يومين';
    if (days >= 3 && days <= 10) return `متأخر منذ ${days} أيام`;
    return `متأخر منذ ${days} يوماً`;
  };
  
  const handleSettingsChange = (field: keyof NotificationSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const notificationCount = notifications.length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none">
        <BellIcon className="w-6 h-6" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-96 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-10">
          {showSettingsView ? (
            <div>
              <div className="flex items-center justify-between px-4 py-2 font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                <button onClick={() => setShowSettingsView(false)} className="p-1 -ml-1 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 rounded-full">
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-base">إعدادات الإشعارات</span>
                <div className="w-5 h-5"></div> {/* Spacer */}
              </div>
              <div className="p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">عرض الأقساط المتأخرة</span>
                  <input
                    type="checkbox"
                    checked={settings.showOverdue}
                    onChange={(e) => handleSettingsChange('showOverdue', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">عرض الأقساط القادمة</span>
                  <input
                    type="checkbox"
                    checked={settings.showUpcoming}
                    onChange={(e) => handleSettingsChange('showUpcoming', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
                {settings.showUpcoming && (
                  <div className="pl-4 border-r-2 border-gray-200 dark:border-gray-600 mr-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">تنبيه قبل (أيام)</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.upcomingDaysThreshold}
                        onChange={(e) => handleSettingsChange('upcomingDaysThreshold', parseInt(e.target.value, 10) || 0)}
                        className="w-20 mt-1 block px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-2 font-bold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                <span>إشعارات الأقساط</span>
                <button onClick={() => setShowSettingsView(true)} className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 rounded-full">
                    <SettingsIcon className="w-5 h-5" />
                </button>
              </div>
              {notificationCount > 0 ? (
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map(item => (
                    <li key={item.installment.id} className="border-b dark:border-gray-700 last:border-b-0">
                      <div className={`flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${item.type === 'overdue' ? 'bg-red-50/60 dark:bg-red-900/40' : ''}`}>
                        <div className="mr-3 mt-1 shrink-0">
                            {item.type === 'overdue' ? (
                              <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <CalendarClockIcon className="w-5 h-5 text-yellow-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.customerName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.productName}</p>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="font-bold text-gray-700 dark:text-gray-200">
                                    {formatCurrency(item.installment.amount, appSettings.currency)}
                                </span>
                                {item.type === 'upcoming' ? (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.daysUntilDue === 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'}`}>
                                        {getUpcomingDaysText(item.daysUntilDue)}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                        {getOverdueDaysText(item.daysOverdue)}
                                    </span>
                                )}
                            </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 px-2">لا توجد إشعارات حسب الإعدادات الحالية.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;