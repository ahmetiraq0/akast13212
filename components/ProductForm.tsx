import React, { useState, useEffect } from 'react';
import { CatalogProduct, PricingPlan } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface ProductFormProps {
  onSave: (product: Omit<CatalogProduct, 'id' | 'createdAt'> | CatalogProduct) => void;
  onCancel: () => void;
  existingProduct?: CatalogProduct;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel, existingProduct }) => {
  const isEditMode = !!existingProduct;

  const [name, setName] = useState('');
  const [productPhoto, setProductPhoto] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setProductPhoto(existingProduct.productPhoto);
      setCategory(existingProduct.category || '');
      setPlans(existingProduct.plans || []);
    } else {
        // Add one default plan for new products
        handleAddPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProduct]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddPlan = () => {
    setPlans(prev => [...prev, {
        id: `plan_${Date.now()}_${prev.length}`,
        name: `خطة ${prev.length + 1}`,
        description: '',
        totalPrice: 0,
        downPayment: 0,
        installmentsCount: 12
    }]);
  };
  
  const handleRemovePlan = (index: number) => {
      setPlans(prev => prev.filter((_, i) => i !== index));
  };
  
  const handlePlanChange = (index: number, field: keyof Omit<PricingPlan, 'id'>, value: string | number) => {
    setPlans(prev => {
        const newPlans = [...prev];
        const plan = { ...newPlans[index] };
        if (field === 'name' || field === 'description') {
            plan[field] = value as string;
        } else {
            plan[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
        }
        newPlans[index] = plan;
        return newPlans;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('اسم المنتج حقل إلزامي.');
      return;
    }
    if (plans.length === 0) {
        setError('يجب إضافة خطة تسعير واحدة على الأقل.');
        return;
    }
    for (const plan of plans) {
        if (!plan.name.trim() || plan.totalPrice <= 0 || plan.installmentsCount < 1) {
            setError(`بيانات الخطة "${plan.name}" غير مكتملة. تأكد من أن السعر وعدد الأقساط صحيح.`);
            return;
        }
    }
    setError('');

    const productData = {
        name,
        productPhoto,
        category,
        plans,
        // We still need a default totalPrice on the root object for backward compatibility and other logic.
        // We can set it to the price of the first plan.
        totalPrice: plans[0]?.totalPrice || 0,
    };

    if (isEditMode && existingProduct) {
      onSave({
        ...existingProduct,
        ...productData,
      });
    } else {
       onSave(productData);
    }
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المنتج</label>
          <input type="text" id="productName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full input-style" required />
        </div>
        <div>
          <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الفئة (الكتالوج)</label>
          <input type="text" id="productCategory" value={category} onChange={e => setCategory(e.target.value)} placeholder="مثال: أجهزة كهربائية" className="mt-1 block w-full input-style" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صورة المنتج (اختياري)</label>
          <div className="mt-1 flex items-center space-x-reverse space-x-4">
            {productPhoto ? (
                <img src={productPhoto} alt="معاينة المنتج" className="h-24 w-24 rounded-md object-cover" />
            ) : (
                <div className="h-24 w-24 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                    <svg className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-700 dark:file:text-teal-200 file:text-teal-700 hover:file:bg-teal-100 dark:hover:file:bg-teal-600" />
          </div>
        </div>
        
        <div className="pt-4 mt-4 border-t dark:border-gray-600">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">خطط التسعير</h4>
            <div className="space-y-4">
            {plans.map((plan, index) => (
                <div key={plan.id} className="p-4 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900/50 relative">
                    <button type="button" onClick={() => handleRemovePlan(index)} className="absolute top-2 left-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300" title="إزالة الخطة"><TrashIcon className="w-5 h-5"/></button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم الخطة</label>
                            <input type="text" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وصف الخطة (اختياري)</label>
                            <input type="text" value={plan.description} onChange={e => handlePlanChange(index, 'description', e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">السعر الكلي</label>
                            <input type="number" value={plan.totalPrice} onChange={e => handlePlanChange(index, 'totalPrice', e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المقدم</label>
                            <input type="number" value={plan.downPayment} onChange={e => handlePlanChange(index, 'downPayment', e.target.value)} className="mt-1 block w-full input-style" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">عدد الأقساط</label>
                            <input type="number" value={plan.installmentsCount} onChange={e => handlePlanChange(index, 'installmentsCount', e.target.value)} min="1" className="mt-1 block w-full input-style" />
                        </div>
                    </div>
                </div>
            ))}
            </div>
             <button type="button" onClick={handleAddPlan} className="mt-4 flex items-center text-teal-600 dark:text-teal-400 font-semibold text-sm">
                <PlusIcon className="w-5 h-5 ml-2" />
                إضافة خطة جديدة
            </button>
        </div>


        <div className="flex justify-end space-x-reverse space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
            <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">{isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
        </div>
      </form>
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

export default ProductForm;