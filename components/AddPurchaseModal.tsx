import React, { useState, useMemo } from 'react';
import { CatalogProduct, Product, Installment, PricingPlan } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useSettings } from '../contexts/SettingsContext';
import { SearchIcon, ChevronLeftIcon, PackageIcon } from './icons';

interface AddPurchaseModalProps {
  catalogProducts: CatalogProduct[];
  onAdd: (product: Omit<Product, 'id' | 'portalId'>) => void;
  onClose: () => void;
  onNavigateToProducts: () => void;
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ catalogProducts, onAdd, onClose, onNavigateToProducts }) => {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState('');
  const { settings } = useSettings();

  const categories = useMemo(() => {
    const uniqueCategories = new Set(catalogProducts.map(p => p.category).filter((c): c is string => !!c));
    return ['all', ...Array.from(uniqueCategories)];
  }, [catalogProducts]);

  const filteredProducts = useMemo(() => {
    let products = catalogProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== 'all') {
        products = products.filter(p => p.category === selectedCategory);
    }
    return products;
  }, [catalogProducts, searchTerm, selectedCategory]);

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    // If there's only one plan, select it automatically
    if (product.plans && product.plans.length === 1) {
        setSelectedPlan(product.plans[0]);
    } else {
        setSelectedPlan(null); // Reset plan selection
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlan) {
        setError('الرجاء اختيار منتج وخطة دفع.');
        return;
    }
    setError('');

    const remainingAfterDownPayment = selectedPlan.totalPrice - selectedPlan.downPayment;
    const monthlyInstallment = selectedPlan.installmentsCount > 0 ? remainingAfterDownPayment / selectedPlan.installmentsCount : 0;
    
    const installments: Installment[] = [];
    let currentDate = new Date();
    for (let i = 0; i < selectedPlan.installmentsCount; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        installments.push({
            id: `${Date.now()}-${i}`,
            dueDate: currentDate.toISOString(),
            amount: monthlyInstallment,
            amountPaid: 0,
            status: 'unpaid'
        });
    }

    onAdd({
        catalogProductId: selectedProduct.id,
        name: selectedProduct.name,
        productPhoto: selectedProduct.productPhoto,
        totalPrice: selectedPlan.totalPrice,
        downPayment: selectedPlan.downPayment,
        installmentsCount: selectedPlan.installmentsCount,
        installments,
        createdAt: new Date().toISOString(),
        planName: selectedPlan.name
    });
  };

  const categoryTranslations: { [key: string]: string } = {
    'all': 'كل الفئات'
  };

  const renderStep1 = () => (
    <div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 px-6 pt-4">الخطوة 1: اختيار المنتج</h3>
        {catalogProducts.length === 0 ? (
             <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">لا توجد منتجات في الكتالوج</h4>
                <p className="mb-4 text-sm">يجب عليك إضافة منتجات إلى الكتالوج العام أولاً قبل أن تتمكن من إضافتها كعملية شراء للزبون.</p>
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        onNavigateToProducts();
                    }}
                    className="flex items-center justify-center w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow"
                >
                    <PackageIcon className="h-5 w-5 ml-2" />
                    <span>الذهاب إلى صفحة المنتجات</span>
                </button>
            </div>
        ) : (
            <>
                <div className="px-6 mb-4 space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category-filter-modal" className="sr-only">تصفية حسب الفئة</label>
                        <select
                            id="category-filter-modal"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {categoryTranslations[cat] || cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProducts.length > 0 ? filteredProducts.map(p => (
                        <li key={p.id} onClick={() => handleSelectProduct(p)} className="flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            {p.productPhoto && <img src={p.productPhoto} alt={p.name} className="w-12 h-12 rounded-md object-cover mr-4" />}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{p.name}</p>
                                {p.category && <p className="text-xs text-gray-500 dark:text-gray-400">{p.category}</p>}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{formatCurrency(p.totalPrice, settings.currency)}</p>
                        </li>
                    )) : (
                        <li className="text-center text-gray-500 dark:text-gray-400 p-6">لا توجد منتجات مطابقة للبحث أو التصفية.</li>
                    )}
                </ul>
            </>
        )}
    </div>
  );

  const renderStep2 = () => {
    if (!selectedProduct) return null;
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center border-b dark:border-gray-700 p-4">
                <button type="button" onClick={() => {setStep(1); setError('')}} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                </button>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mr-2">الخطوة 2: اختيار خطة الدفع</h3>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mb-4">
                    {selectedProduct?.productPhoto && <img src={selectedProduct.productPhoto} alt={selectedProduct.name} className="w-12 h-12 rounded-md object-cover mr-4" />}
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{selectedProduct?.name}</p>
                    </div>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                
                <div className="space-y-3">
                    {selectedProduct.plans && selectedProduct.plans.length > 0 ? selectedProduct.plans.map(plan => {
                        const remaining = plan.totalPrice - plan.downPayment;
                        const monthlyPayment = plan.installmentsCount > 0 ? remaining / plan.installmentsCount : 0;
                        const isSelected = selectedPlan?.id === plan.id;
                        return (
                            <label key={plan.id} className={`block p-4 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-500 ring-2 ring-teal-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500'}`}>
                                <input type="radio" name="pricing-plan" value={plan.id} checked={isSelected} onChange={() => setSelectedPlan(plan)} className="sr-only" />
                                <div className="flex justify-between items-center">
                                    <h5 className="font-bold text-lg text-gray-800 dark:text-gray-100">{plan.name}</h5>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-teal-600 dark:text-teal-400">{formatCurrency(plan.totalPrice, settings.currency)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">السعر الإجمالي</p>
                                    </div>
                                </div>
                                {plan.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>}
                                <div className="mt-4 pt-3 border-t dark:border-gray-600 grid grid-cols-3 gap-2 text-center text-sm">
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">المقدّم</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(plan.downPayment, settings.currency)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">عدد الأقساط</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{plan.installmentsCount}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">القسط الشهري</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(monthlyPayment, settings.currency)}</span>
                                    </div>
                                </div>
                            </label>
                        )
                    }) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-6 border-2 border-dashed rounded-lg">
                            <p>لا توجد خطط تسعير معرفة لهذا المنتج.</p>
                            <p className="text-xs mt-1">الرجاء تعديل المنتج وإضافة خطة تسعير واحدة على الأقل.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-reverse space-x-3">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">إلغاء</button>
                <button type="submit" disabled={!selectedPlan} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">حفظ المنتج للزبون</button>
            </div>
        </form>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-xl sm:w-full" onClick={e => e.stopPropagation()}>
            {step === 1 ? renderStep1() : renderStep2()}
        </div>
    </div>
  );
};

export default AddPurchaseModal;