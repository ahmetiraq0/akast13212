import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerFormProps {
  onAddCustomer: (customer: Omit<Customer, 'id' | 'products' | 'createdAt'>) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onAddCustomer, onCancel }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      setError('الاسم الكامل ورقم الهاتف حقول إلزامية.');
      return;
    }
    setError('');
    onAddCustomer({ fullName, phone, address, idPhoto });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">إضافة زبون جديد</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف <span className="text-red-500">*</span></label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صورة من الهوية (اختياري)</label>
          <div className="mt-1 flex items-center space-x-reverse space-x-4">
            {idPhoto ? (
                <img src={idPhoto} alt="معاينة الهوية" className="h-24 w-36 rounded-md object-cover" />
            ) : (
                <div className="h-24 w-36 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                    <svg className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-700 dark:file:text-teal-200 file:text-teal-700 hover:file:bg-teal-100 dark:hover:file:bg-teal-600" />
          </div>
        </div>
        <div className="flex justify-end space-x-reverse space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            حفظ الزبون
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;