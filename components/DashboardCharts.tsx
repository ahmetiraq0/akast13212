import React, { useMemo } from 'react';
import { Customer, Expense, InstallmentStatus } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/formatters';

interface DashboardChartsProps {
  customers: Customer[];
  expenses: Expense[];
}

const ChartCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        {children}
    </div>
);

const DonutChart: React.FC<{ data: { label: string, value: number, color: string, darkColor: string }[], total: number }> = ({ data, total }) => {
    if (total === 0) {
        return <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">لا توجد بيانات لعرضها.</div>;
    }
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
                <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle className="text-gray-200 dark:text-gray-700" strokeWidth="15" stroke="currentColor" fill="transparent" r={radius} cx="75" cy="75" />
                    {data.map((item, index) => {
                        const dasharray = (item.value / total) * circumference;
                        const strokeDashoffset = accumulatedOffset;
                        accumulatedOffset += dasharray;
                        return (
                            <circle
                                key={index}
                                className={`${item.color} ${item.darkColor}`}
                                strokeWidth="15"
                                strokeDasharray={`${dasharray} ${circumference}`}
                                strokeDashoffset={-strokeDashoffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="75"
                                cy="75"
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{total}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">قسط</span>
                </div>
            </div>
             <div className="flex flex-col gap-2">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${item.color} ${item.darkColor}`}></span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}:</span>
                        <span className="text-sm font-semibold mr-2 text-gray-800 dark:text-gray-100">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, income: number, expense: number }[] }> = ({ data }) => {
    const { settings } = useSettings();
    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);

    return (
        <div className="h-72 flex justify-around items-end gap-2 p-4 border-t border-b dark:border-gray-700">
            {data.map(month => (
                <div key={month.label} className="flex-1 flex flex-col items-center gap-1">
                     <div className="h-full flex items-end gap-1">
                        <div 
                            title={`الدخل: ${formatCurrency(month.income, settings.currency)}`}
                            className="w-5 bg-green-500 rounded-t-sm hover:bg-green-400 transition-colors"
                            style={{ height: `${(month.income / maxValue) * 100}%`}}
                        ></div>
                        <div 
                            title={`المصروف: ${formatCurrency(month.expense, settings.currency)}`}
                            className="w-5 bg-red-500 rounded-t-sm hover:bg-red-400 transition-colors"
                            style={{ height: `${(month.expense / maxValue) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{month.label}</span>
                </div>
            ))}
        </div>
    );
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ customers, expenses }) => {

    const installmentStats = useMemo(() => {
        const stats: { [key in InstallmentStatus]: number } = {
            paid: 0,
            unpaid: 0,
            partially_paid: 0,
            on_hold: 0
        };
        let total = 0;
        customers.forEach(c => c.products.forEach(p => p.installments.forEach(i => {
            stats[i.status]++;
            total++;
        })));
        return { ...stats, total };
    }, [customers]);

    const financialMonthlyStats = useMemo(() => {
        const months: { label: string, income: number, expense: number }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('ar-IQ', { month: 'short' });
            months.push({ label: monthLabel, income: 0, expense: 0 });
        }

        customers.forEach(c => {
            c.products.forEach(p => {
                const checkAndAdd = (amount: number, dateString: string) => {
                     const date = new Date(dateString);
                     const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
                     if (monthDiff >= 0 && monthDiff < 6) {
                         months[5 - monthDiff].income += amount;
                     }
                }
                // Downpayment
                checkAndAdd(p.downPayment, p.createdAt);
                // Paid installments
                p.installments.forEach(i => {
                    if (i.paidAt) {
                       checkAndAdd(i.amountPaid, i.paidAt);
                    }
                });
            });
        });
        
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
            if (monthDiff >= 0 && monthDiff < 6) {
                months[5 - monthDiff].expense += exp.amount;
            }
        });

        return months;
    }, [customers, expenses]);

    const donutData = [
        { label: 'مدفوع', value: installmentStats.paid, color: 'text-green-500', darkColor: 'dark:text-green-400' },
        { label: 'مدفوع جزئياً', value: installmentStats.partially_paid, color: 'text-yellow-500', darkColor: 'dark:text-yellow-400' },
        { label: 'غير مدفوع', value: installmentStats.unpaid, color: 'text-red-500', darkColor: 'dark:text-red-400' },
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="حالة الأقساط">
                <DonutChart data={donutData} total={installmentStats.total} />
            </ChartCard>
            <ChartCard title="الدخل والمصروفات (آخر 6 أشهر)">
                <BarChart data={financialMonthlyStats} />
            </ChartCard>
        </div>
    );
};

export default DashboardCharts;
