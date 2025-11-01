import React, { useMemo } from 'react';
import { Customer, Expense } from '../types';
import CustomerList from './CustomerList';
import { formatCurrency } from '../utils/formatters';
import { DollarSignIcon, CreditCardIcon, CheckCircleIcon, BarChartIcon, PackageIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardProps {
  customers: Customer[];
  expenses: Expense[];
  onViewCustomer: (customerId: string) => void;
  onAddCustomerClick: () => void;
  onNavigateToReports: () => void;
  onNavigateToProducts: () => void;
  onNavigateToExpenses: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; darkColor: string }> = ({ icon, title, value, color, darkColor }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full ${color} ${darkColor}`}>
      {icon}
    </div>
    <div className="mr-4">
      <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void; }> = ({ icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
  >
    {icon}
    <span className="mt-2 font-semibold text-gray-700 dark:text-gray-200">{title}</span>
  </button>
);


const Dashboard: React.FC<DashboardProps> = ({ customers, expenses, onViewCustomer, onAddCustomerClick, onNavigateToReports, onNavigateToProducts, onNavigateToExpenses }) => {
  const { settings } = useSettings();
  
  const stats = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    
    customers.forEach(customer => {
      customer.products.forEach(product => {
        totalAmount += product.totalPrice;
        totalPaid += product.downPayment;
        product.installments.forEach(inst => {
          totalPaid += inst.amountPaid;
        });
      });
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      totalAmount,
      totalPaid,
      totalRemaining: totalAmount - totalPaid,
      totalExpenses
    };
  }, [customers, expenses]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">لوحة التحكم</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">نظرة عامة على الأقساط والزبائن.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSignIcon className="h-6 w-6 text-green-600" />} title="إجمالي المبيعات" value={formatCurrency(stats.totalAmount, settings.currency)} color="bg-green-100" darkColor="dark:bg-green-900/50" />
        <StatCard icon={<CheckCircleIcon className="h-6 w-6 text-blue-600" />} title="المبالغ المحصلة" value={formatCurrency(stats.totalPaid, settings.currency)} color="bg-blue-100" darkColor="dark:bg-blue-900/50" />
        <StatCard icon={<CreditCardIcon className="h-6 w-6 text-orange-600" />} title="المبالغ المتبقية" value={formatCurrency(stats.totalRemaining, settings.currency)} color="bg-orange-100" darkColor="dark:bg-orange-900/50" />
        <StatCard icon={<CreditCardIcon className="h-6 w-6 text-red-600" />} title="إجمالي المصروفات" value={formatCurrency(stats.totalExpenses, settings.currency)} color="bg-red-100" darkColor="dark:bg-red-900/50" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <ActionButton 
                icon={<PackageIcon className="h-8 w-8 text-teal-600 dark:text-teal-400" />}
                title="إدارة المنتجات"
                onClick={onNavigateToProducts}
            />
            <ActionButton 
                icon={<DollarSignIcon className="h-8 w-8 text-red-500" />}
                title="إدارة المصروفات"
                onClick={onNavigateToExpenses}
            />
            <ActionButton 
                icon={<BarChartIcon className="h-8 w-8 text-blue-500" />}
                title="عرض التقارير"
                onClick={onNavigateToReports}
            />
        </div>
      </div>

      <CustomerList customers={customers} onViewCustomer={onViewCustomer} onAddCustomerClick={onAddCustomerClick} />

    </div>
  );
};

export default Dashboard;