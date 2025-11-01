import React, { useState, useMemo } from 'react';
import { Customer, Expense } from '../types';
import { formatCurrency } from '../utils/formatters';
import { PrinterIcon, BarChartIcon, FileDownIcon, CheckCircleIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface ReportsProps {
  customers: Customer[];
  expenses: Expense[];
  onBack: () => void;
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
  </div>
);

const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

const Reports: React.FC<ReportsProps> = ({ customers, expenses, onBack }) => {
  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [groupBy, setGroupBy] = useState<'customer' | 'product'>('customer');
  const { settings } = useSettings();

  const reportData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let totalPaidInPeriod = 0;
    const breakdown: { [key: string]: { name: string, paid: number } } = {};

    customers.forEach(customer => {
        customer.products.forEach(product => {
            let productPaidInPeriod = 0;
            // Down payment is considered paid on product creation date
            const productDate = new Date(product.createdAt);
            if (productDate >= start && productDate <= end) {
                productPaidInPeriod += product.downPayment;
            }
            
            product.installments.forEach(inst => {
                if (inst.paidAt) {
                    const paidDate = new Date(inst.paidAt);
                    if (paidDate >= start && paidDate <= end) {
                        productPaidInPeriod += inst.amountPaid;
                    }
                }
            });

            if(productPaidInPeriod > 0) {
                 totalPaidInPeriod += productPaidInPeriod;
                 const key = groupBy === 'customer' ? customer.id : product.name;
                 const name = groupBy === 'customer' ? customer.fullName : product.name;
                 
                 if (!breakdown[key]) {
                     breakdown[key] = { name: name, paid: 0 };
                 }
                 breakdown[key].paid += productPaidInPeriod;
            }
        });
    });

    const expensesInPeriod = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end;
    });

    const totalExpensesInPeriod = expensesInPeriod.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalPaidInPeriod - totalExpensesInPeriod;
    
    return {
        totalPaidInPeriod,
        totalExpensesInPeriod,
        netProfit,
        breakdown: Object.values(breakdown).sort((a, b) => b.paid - a.paid),
        expensesInPeriod: expensesInPeriod.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };

  }, [customers, expenses, startDate, endDate, groupBy]);
  
  const handleExportCSV = () => {
    let csvContent = `\uFEFF`; // BOM for UTF-8
    csvContent += `تقرير الفترة من,${startDate},إلى,${endDate}\n`;
    csvContent += `إجمالي المدفوعات,${reportData.totalPaidInPeriod}\n`;
    csvContent += `إجمالي المصروفات,${reportData.totalExpensesInPeriod}\n`;
    csvContent += `صافي الربح,${reportData.netProfit}\n\n`;

    if (reportData.breakdown.length > 0) {
        csvContent += `تفاصيل المدفوعات حسب ${groupBy === 'customer' ? 'الزبون' : 'المنتج'}\n`;
        const headers = [groupBy === 'customer' ? 'اسم الزبون' : 'اسم المنتج', 'المبلغ المدفوع'];
        csvContent += headers.join(',') + '\n';
        reportData.breakdown.forEach(item => {
            csvContent += `"${item.name.replace(/"/g, '""')}",${item.paid}\n`;
        });
    }

    csvContent += '\n';

    if (reportData.expensesInPeriod.length > 0) {
        csvContent += 'تفاصيل المصروفات\n';
        const expenseHeaders = ['التاريخ', 'الوصف', 'الفئة', 'المبلغ'];
        csvContent += expenseHeaders.join(',') + '\n';
        reportData.expensesInPeriod.forEach(exp => {
            csvContent += `${exp.date},"${exp.description.replace(/"/g, '""')}",${exp.category},${exp.amount}\n`;
        });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
        <div id="report-content" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex items-center">
                        <BarChartIcon className="w-8 h-8 text-teal-600 dark:text-teal-400 ml-3" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">التقارير المالية</h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">ملخص الأداء المالي للفترة المحددة.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 print:hidden">
                        <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">رجوع</button>
                        <button onClick={handleExportCSV} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <FileDownIcon className="h-5 w-5 ml-2" />
                            تصدير CSV
                        </button>
                        <button onClick={() => window.print()} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                            <PrinterIcon className="h-5 w-5 ml-2" />
                            طباعة
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md print:hidden">
                <h2 className="font-bold text-lg mb-4">تحديد فترة التقرير</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full input-style" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تجميع حسب</label>
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center">
                                <input type="radio" name="groupBy" value="customer" checked={groupBy === 'customer'} onChange={() => setGroupBy('customer')} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300" />
                                <span className="mr-2">الزبون</span>
                            </label>
                             <label className="flex items-center">
                                <input type="radio" name="groupBy" value="product" checked={groupBy === 'product'} onChange={() => setGroupBy('product')} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300" />
                                <span className="mr-2">المنتج</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="إجمالي المدفوعات (في الفترة)" value={formatCurrency(reportData.totalPaidInPeriod, settings.currency)} />
                <StatCard title="إجمالي المصروفات (في الفترة)" value={formatCurrency(reportData.totalExpensesInPeriod, settings.currency)} />
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4">
                    <CheckCircleIcon className={`w-10 h-10 ${reportData.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <div>
                        <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400">صافي الربح</h3>
                        <p className={`text-xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(reportData.netProfit, settings.currency)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        تفاصيل المدفوعات حسب {groupBy === 'customer' ? 'الزبائن' : 'المنتجات'}
                    </h2>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{groupBy === 'customer' ? 'اسم الزبون' : 'اسم المنتج'}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المبلغ المدفوع</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.breakdown.length > 0 ? reportData.breakdown.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(item.paid, settings.currency)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={2} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            لا توجد مدفوعات للفترة المحددة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        تفاصيل المصروفات
                    </h2>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">التاريخ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الوصف</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المبلغ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {reportData.expensesInPeriod.length > 0 ? reportData.expensesInPeriod.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{formatCurrency(item.amount, settings.currency)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            لا توجد مصروفات للفترة المحددة.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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
            }
            .input-style:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                --tw-ring-color: #0d9488;
                 border-color: #0d9488;
            }
             @media print {
                body {
                    background-color: white !important;
                }
                /* Hide everything by default */
                body * {
                    visibility: hidden;
                }
                /* Make only the report content and its children visible */
                #report-content, #report-content * {
                    visibility: visible;
                }
                /* Position the report content to fill the page */
                #report-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
                
                /* General print style resets for a clean look */
                #report-content * {
                    color: black !important;
                    background-color: transparent !important;
                    box-shadow: none !important;
                }

                #report-content .rounded-lg {
                    border-radius: 0 !important;
                }

                /* Add borders to cards to separate them visually */
                #report-content .shadow-md, #report-content .shadow {
                    border: 1px solid #e5e7eb;
                    page-break-inside: avoid;
                }
                
                /* Ensure table headers are visually distinct */
                #report-content thead {
                    background-color: #f9fafb !important;
                }

                /* Prevent breaking table rows across pages */
                #report-content tr {
                    page-break-inside: avoid !important;
                }
            }
        `}</style>
    </div>
  );
};

export default Reports;