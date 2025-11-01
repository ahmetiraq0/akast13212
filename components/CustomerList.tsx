import React, { useState, useMemo, useCallback } from 'react';
import { Customer } from '../types';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, SearchIcon, FilterIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface CustomerListProps {
  customers: Customer[];
  onViewCustomer: (customerId: string) => void;
  onAddCustomerClick: () => void;
}

const calculateRemainingForCustomer = (customer: Customer): number => {
    return customer.products.reduce((totalRemaining, product) => {
        const paidAmount = product.downPayment + product.installments
            .reduce((sum, i) => sum + i.amountPaid, 0);
        return totalRemaining + (product.totalPrice - paidAmount);
    }, 0);
};

const initialFilters = {
    sortBy: 'date_desc',
    dateFrom: '',
    dateTo: '',
    remainingAmount: 'any',
    productCount: 'any'
};

const CustomerList: React.FC<CustomerListProps> = ({ customers, onViewCustomer, onAddCustomerClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  
  const { settings } = useSettings();
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({...prev, [name]: value}));
  };
  
  const resetFilters = () => {
    setFilters(initialFilters);
  };


  const filteredCustomers = useMemo(() => {
    // Basic text search first
    let result = customers.filter(customer =>
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply advanced filters
    if (filters.dateFrom) {
        result = result.filter(c => new Date(c.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the whole day
        result = result.filter(c => new Date(c.createdAt) <= toDate);
    }

    if (filters.productCount !== 'any') {
        const [min, max] = {
            '1-2': [1, 2],
            '3-5': [3, 5],
            '6+': [6, Infinity],
        }[filters.productCount] || [0, 0];
        result = result.filter(c => c.products.length >= min && c.products.length <= max);
    }
    
    // FIX: Explicitly type the map to ensure correct type inference for remaining amounts.
    const customerRemainings: Map<string, number> = new Map(result.map(c => [c.id, calculateRemainingForCustomer(c)]));

    if (filters.remainingAmount !== 'any') {
        result = result.filter(c => {
            const remaining = customerRemainings.get(c.id) || 0;
            switch (filters.remainingAmount) {
                case 'has_debt': return remaining > 0;
                case 'paid_off': return remaining <= 0;
                case '>100k': return remaining > 100000;
                case '>500k': return remaining > 500000;
                default: return true;
            }
        });
    }

    // Apply sorting
    result.sort((a, b) => {
        switch (filters.sortBy) {
            case 'date_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'remaining_desc': return (customerRemainings.get(b.id) || 0) - (customerRemainings.get(a.id) || 0);
            case 'remaining_asc': return (customerRemainings.get(a.id) || 0) - (customerRemainings.get(b.id) || 0);
            case 'name_asc': return a.fullName.localeCompare(b.fullName, 'ar');
            case 'name_desc': return b.fullName.localeCompare(a.fullName, 'ar');
            case 'date_desc':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    return result;
  }, [customers, searchTerm, filters]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">قائمة الزبائن</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، أو العنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
           <button onClick={() => setShowFilters(prev => !prev)} className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors shadow ${showFilters ? 'bg-teal-700 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                <FilterIcon className="h-5 w-5 ml-2" />
                <span>تصفية</span>
            </button>
          <button
            onClick={onAddCustomerClick}
            className="flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            <span>زبون جديد</span>
          </button>
        </div>
      </div>
      
       {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 border dark:border-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ترتيب حسب</label>
                      <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="w-full mt-1 input-style">
                          <option value="date_desc">الأحدث أولاً</option>
                          <option value="date_asc">الأقدم أولاً</option>
                          <option value="remaining_desc">الأعلى مديونية</option>
                          <option value="remaining_asc">الأقل مديونية</option>
                          <option value="name_asc">الاسم (أ-ي)</option>
                          <option value="name_desc">الاسم (ي-أ)</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ المتبقي</label>
                      <select name="remainingAmount" value={filters.remainingAmount} onChange={handleFilterChange} className="w-full mt-1 input-style">
                          <option value="any">الكل</option>
                          <option value="has_debt">لديه مديونية</option>
                          <option value="paid_off">مسدد بالكامل</option>
                          <option value=">100k">أكثر من 100,000 د.ع</option>
                          <option value=">500k">أكثر من 500,000 د.ع</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">عدد المنتجات</label>
                       <select name="productCount" value={filters.productCount} onChange={handleFilterChange} className="w-full mt-1 input-style">
                          <option value="any">الكل</option>
                          <option value="1-2">1 - 2</option>
                          <option value="3-5">3 - 5</option>
                          <option value="6+">6 أو أكثر</option>
                      </select>
                  </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الإنشاء (من)</label>
                      <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full mt-1 input-style"/>
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الإنشاء (إلى)</label>
                      <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full mt-1 input-style"/>
                  </div>
              </div>
               <div className="mt-4 flex justify-end">
                   <button onClick={resetFilters} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500">
                       إعادة تعيين
                   </button>
               </div>
          </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الاسم الكامل</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">رقم الهاتف</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عدد المنتجات</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">إجمالي المتبقي</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">عرض</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{customer.fullName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    أضيف في: {new Date(customer.createdAt).toLocaleDateString('ar-IQ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{customer.products.length}</div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(calculateRemainingForCustomer(customer), settings.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <button onClick={() => onViewCustomer(customer.id)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">
                    عرض التفاصيل
                  </button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                        لا يوجد زبائن مطابقين للبحث أو التصفية.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
       <style>{`
            .input-style {
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                border-radius: 0.375rem;
                border-width: 1px;
                border-color: #D1D5DB;
                padding: 0.5rem 0.75rem;
                background-color: white;
                 -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
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
        `}</style>
    </div>
  );
};

export default CustomerList;