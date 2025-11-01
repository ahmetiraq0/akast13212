import React, { useState, useEffect } from 'react';
import { Customer, Product, Installment, CatalogProduct, InstallmentStatus, ShopInfo } from '../types';
import InstallmentForm from './InstallmentForm';
import PrintReceipt from './PrintReceipt';
import AddPurchaseModal from './AddPurchaseModal';
import RecordPaymentModal from './RecordPaymentModal';
import { formatCurrency } from '../utils/formatters';
import { generateWhatsAppReminderUrl, sanitizePhoneNumber } from '../utils/whatsappHelper';
import { PlusIcon, PrinterIcon, TrashIcon, WhatsAppIcon, PencilIcon, ClipboardIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { useSettings, SoundType } from '../contexts/SettingsContext';

interface InstallmentDetailsProps {
  customer: Customer;
  catalogProducts: CatalogProduct[];
  shopInfo: ShopInfo;
  onUpdateCustomer: (customer: Customer) => void;
  onAddProduct: (customerId: string, product: Omit<Product, 'id' | 'portalId'>) => void;
  onDeleteCustomer: (customerId: string) => void;
  onDeleteProduct: (customerId: string, productId: string) => void;
  onShowToast: (message: string, soundType?: SoundType) => void;
  onShowConfirmation: (modalState: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonText?: string;
    confirmButtonClass?: string;
  }) => void;
  onNavigate: (view: 'products') => void;
}

const InstallmentDetails: React.FC<InstallmentDetailsProps> = ({ customer, catalogProducts, shopInfo, onUpdateCustomer, onAddProduct, onDeleteCustomer, onDeleteProduct, onShowToast, onShowConfirmation, onNavigate }) => {
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showPrintView, setShowPrintView] = useState<Product | null>(null);
  const [addingInstallmentTo, setAddingInstallmentTo] = useState<string | null>(null);
  const [paymentModalInfo, setPaymentModalInfo] = useState<{product: Product, installment: Installment} | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPhoto, setEditedPhoto] = useState<string | undefined>(undefined);
  
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editedCustomerData, setEditedCustomerData] = useState({ fullName: '', phone: '', address: '', idPhoto: undefined as string | undefined });

  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(customer.products[0]?.id || null);

  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [editedInstallmentData, setEditedInstallmentData] = useState({ amount: 0, dueDate: '' });


  const { settings } = useSettings();

  useEffect(() => {
    const isSelectedProductStillExists = customer.products.some(p => p.id === selectedProductId);
    if (!isSelectedProductStillExists && customer.products.length > 0) {
        setSelectedProductId(customer.products[0].id);
        setSelectedInstallments(new Set()); 
    } else if (customer.products.length === 0) {
        setSelectedProductId(null);
        setSelectedInstallments(new Set());
    }
  }, [customer.products, selectedProductId]);

  const handleProductSelectionChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedInstallments(new Set()); // Reset selections when changing product
  };

  const selectedProduct = customer.products.find(p => p.id === selectedProductId);


  const handleSelectInstallment = (installmentId: string) => {
    setSelectedInstallments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(installmentId)) {
            newSet.delete(installmentId);
        } else {
            newSet.add(installmentId);
        }
        return newSet;
    });
  };

  const handleSelectAllForProduct = (product: Product) => {
    const productInstallmentIds = product.installments.map(i => i.id);
    const allSelectedInProduct = productInstallmentIds.length > 0 && productInstallmentIds.every(id => selectedInstallments.has(id));
    
    setSelectedInstallments(prev => {
        const newSet = new Set(prev);
        if (allSelectedInProduct) {
            productInstallmentIds.forEach(id => newSet.delete(id));
        } else {
            productInstallmentIds.forEach(id => newSet.add(id));
        }
        return newSet;
    });
  };

  const handleBulkUpdate = (status: 'paid' | 'partially_paid') => {
      const selectedCount = selectedInstallments.size;
      if (selectedCount === 0) return;

      const statusText = status === 'paid' ? 'مدفوع' : 'مدفوع جزئياً';

      onShowConfirmation({
          isOpen: true,
          title: `تأكيد تحديث الحالة`,
          message: `هل أنت متأكد من تحديث حالة ${selectedCount} قسط إلى "${statusText}"؟`,
          confirmButtonText: 'نعم، قم بالتحديث',
          confirmButtonClass: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
          onConfirm: () => {
              const updatedCustomer = JSON.parse(JSON.stringify(customer));
              let updatedCount = 0;

              updatedCustomer.products.forEach((product: Product) => {
                  product.installments.forEach((installment: Installment) => {
                      if (selectedInstallments.has(installment.id)) {
                          updatedCount++;
                          if (status === 'paid') {
                              installment.status = 'paid';
                              installment.amountPaid = installment.amount;
                              installment.paidAt = new Date().toISOString();
                          } else if (status === 'partially_paid') {
                              installment.status = 'partially_paid';
                              delete installment.paidAt;
                          }
                      }
                  });
              });
              
              if (updatedCount > 0) {
                onUpdateCustomer(updatedCustomer);
                onShowToast(`تم تحديث حالة ${updatedCount} قسط بنجاح.`, 'success');
              }
              setSelectedInstallments(new Set());
          }
      });
  };


  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditedName(product.name);
    setEditedPhoto(product.productPhoto);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditedName('');
    setEditedPhoto(undefined);
  };

  const handleSaveEdit = (productId: string) => {
    if (!editingProduct) return;
    const updatedProduct = { ...editingProduct, name: editedName, productPhoto: editedPhoto };
    const updatedCustomer = {
        ...customer,
        products: customer.products.map(p => p.id === productId ? updatedProduct : p),
    };
    onUpdateCustomer(updatedCustomer);
    handleCancelEdit();
  };

  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleStartEditCustomer = () => {
    setEditedCustomerData({
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        idPhoto: customer.idPhoto
    });
    setIsEditingCustomer(true);
  };

  const handleCancelEditCustomer = () => {
    setIsEditingCustomer(false);
  };

  const handleSaveCustomer = () => {
    onUpdateCustomer({ ...customer, ...editedCustomerData });
    setIsEditingCustomer(false);
  };
  
  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedCustomerData(prev => ({...prev, [name]: value}));
  };

  const handleCustomerIdPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedCustomerData(prev => ({...prev, idPhoto: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecordPayment = (productId: string, installmentId: string, paymentAmount: number) => {
    const updatedCustomer = { ...customer };
    const product = updatedCustomer.products.find(p => p.id === productId);
    if (product) {
      const installment = product.installments.find(i => i.id === installmentId);
      if (installment) {
        const newAmountPaid = installment.amountPaid + paymentAmount;
        installment.amountPaid = newAmountPaid > installment.amount ? installment.amount : newAmountPaid;

        if (installment.amountPaid >= installment.amount) {
            installment.status = 'paid';
            installment.paidAt = new Date().toISOString();
        } else if (installment.amountPaid > 0) {
            installment.status = 'partially_paid';
            delete installment.paidAt;
        } else {
            installment.status = 'unpaid';
            delete installment.paidAt;
        }

        onUpdateCustomer(updatedCustomer);
        onShowToast('تم تسجيل الدفعة بنجاح!', 'payment');
      }
    }
    setPaymentModalInfo(null);
  };
  
  const handleAddProduct = (product: Omit<Product, 'id' | 'portalId'>) => {
      onAddProduct(customer.id, product);
      setShowAddPurchaseModal(false);
  }

  const handleAddInstallment = (productId: string, newInstallmentData: Omit<Installment, 'id' | 'status' | 'paidAt' | 'amountPaid'>) => {
    const updatedCustomer = { ...customer };
    const product = updatedCustomer.products.find(p => p.id === productId);
    if (product) {
        const newInstallment: Installment = {
            ...newInstallmentData,
            id: `inst_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
            status: 'unpaid',
            amountPaid: 0,
        };
        product.installments.push(newInstallment);
        product.installments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        product.installmentsCount = product.installments.length;
        product.totalPrice += newInstallment.amount;

        onUpdateCustomer(updatedCustomer);
        onShowToast('تم إضافة القسط بنجاح!', 'add');
        setAddingInstallmentTo(null);
    }
  };
  
  const handleSendWhatsApp = (customer: Customer, product: Product, installment: Installment) => {
    const url = generateWhatsAppReminderUrl(customer, product, installment, settings.currency);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendWhatsAppConfirmation = (customer: Customer, product: Product, installment: Installment) => {
    const paidAtFormatted = installment.paidAt ? new Date(installment.paidAt).toLocaleDateString('ar-IQ') : 'غير محدد';
    const amountFormatted = formatCurrency(installment.amount, settings.currency);

    const paidAmount = product.downPayment + product.installments
      .reduce((sum, i) => sum + i.amountPaid, 0);
    const remainingAmount = product.totalPrice - paidAmount;
    const remainingAmountFormatted = formatCurrency(remainingAmount, settings.currency);

    const message = `مرحباً ${customer.fullName}،\n\nتم استلام دفعة القسط بنجاح الخاص بـ *${product.name}*.\n\n- مبلغ القسط: ${amountFormatted}\n- تاريخ الدفع: ${paidAtFormatted}\n\n- المبلغ المتبقي للمنتج: ${remainingAmountFormatted}\n\nشكراً لالتزامكم.`;

    const encodedMessage = encodeURIComponent(message);
    const sanitizedPhone = sanitizePhoneNumber(customer.phone);
    
    const url = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
    const getStatusBadge = (status: InstallmentStatus) => {
        switch(status) {
            case 'paid':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">مدفوع</span>;
            case 'partially_paid':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">مدفوع جزئياً</span>;
            case 'on_hold':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">معلق</span>;
            case 'unpaid':
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">غير مدفوع</span>;
        }
    };

    const handleStartEditInstallment = (installment: Installment) => {
      setEditingInstallmentId(installment.id);
      const formattedDate = new Date(installment.dueDate).toISOString().split('T')[0];
      setEditedInstallmentData({ amount: installment.amount, dueDate: formattedDate });
    };

    const handleCancelEditInstallment = () => {
        setEditingInstallmentId(null);
    };

    const handleSaveInstallment = (productId: string) => {
        if (!editingInstallmentId) return;

        const numAmount = Number(editedInstallmentData.amount);
        if (isNaN(numAmount) || numAmount <= 0 || !editedInstallmentData.dueDate) {
            onShowToast('الرجاء إدخال مبلغ وتاريخ صحيحين.', 'delete');
            return;
        }

        const updatedCustomer = JSON.parse(JSON.stringify(customer));
        const product = updatedCustomer.products.find((p: Product) => p.id === productId);

        if (product) {
            const installment = product.installments.find((i: Installment) => i.id === editingInstallmentId);
            if (installment) {
                const originalAmount = installment.amount;
                const amountDifference = numAmount - originalAmount;

                installment.amount = numAmount;
                installment.dueDate = new Date(editedInstallmentData.dueDate).toISOString();

                if (installment.amountPaid > installment.amount) {
                    installment.amountPaid = installment.amount;
                }

                if (installment.amountPaid >= installment.amount) {
                    installment.status = 'paid';
                    if (!installment.paidAt) installment.paidAt = new Date().toISOString();
                } else if (installment.amountPaid > 0) {
                    installment.status = 'partially_paid';
                    delete installment.paidAt;
                } else {
                    installment.status = 'unpaid';
                    delete installment.paidAt;
                }

                product.totalPrice += amountDifference;
                product.installments.sort((a: Installment, b: Installment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                onUpdateCustomer(updatedCustomer);
                onShowToast('تم تحديث القسط بنجاح!', 'success');
                handleCancelEditInstallment();
            }
        }
    };
  
  if (showPrintView) {
      return <PrintReceipt customer={customer} product={showPrintView} onBack={() => setShowPrintView(null)} shopInfo={shopInfo} />
  }

  return (
    <div className="space-y-8">
      {showAddPurchaseModal && (
        <AddPurchaseModal 
            catalogProducts={catalogProducts}
            onAdd={handleAddProduct}
            onClose={() => setShowAddPurchaseModal(false)}
            onNavigateToProducts={() => onNavigate('products')}
        />
      )}
      {paymentModalInfo && (
        <RecordPaymentModal
          isOpen={!!paymentModalInfo}
          onClose={() => setPaymentModalInfo(null)}
          onSave={(paymentAmount) => handleRecordPayment(paymentModalInfo.product.id, paymentModalInfo.installment.id, paymentAmount)}
          product={paymentModalInfo.product}
          installment={paymentModalInfo.installment}
        />
      )}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        {isEditingCustomer ? (
            <div className="space-y-4">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">تعديل بيانات الزبون</h2>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                    <input type="text" name="fullName" value={editedCustomerData.fullName} onChange={handleCustomerDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف</label>
                    <input type="text" name="phone" value={editedCustomerData.phone} onChange={handleCustomerDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</label>
                    <input type="text" name="address" value={editedCustomerData.address} onChange={handleCustomerDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صورة من الهوية</label>
                     <div className="mt-1 flex items-center space-x-reverse space-x-4">
                        {editedCustomerData.idPhoto ? (
                            <img src={editedCustomerData.idPhoto} alt="معاينة الهوية" className="h-24 w-36 rounded-md object-cover" />
                        ) : (
                            <div className="h-24 w-36 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <svg className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleCustomerIdPhotoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-700 dark:file:text-teal-200 dark:hover:file:bg-teal-600" />
                    </div>
                </div>
                 <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
                    <button onClick={handleCancelEditCustomer} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">إلغاء</button>
                    <button onClick={handleSaveCustomer} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">حفظ التعديلات</button>
                </div>
            </div>
        ) : (
            <>
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{customer.fullName}</h1>
                            <button onClick={handleStartEditCustomer} className="flex items-center text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                <PencilIcon className="h-4 w-4 ml-1" />
                                <span>تعديل البيانات</span>
                            </button>
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">الهاتف: {customer.phone} | العنوان: {customer.address || 'غير محدد'}</p>
                         {customer.createdAt && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            تاريخ التسجيل: {new Date(customer.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                    </div>
                    <button onClick={() => onDeleteCustomer(customer.id)} className="flex items-center text-sm bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors mt-2 sm:mt-0">
                        <TrashIcon className="h-4 w-4 ml-1" />
                        حذف الزبون
                    </button>
                </div>
                {customer.idPhoto && <img src={customer.idPhoto} alt="هوية الزبون" className="mt-4 rounded-lg max-h-48" />}
            </>
        )}
      </div>

      {customer.products.length > 1 && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <label htmlFor="product-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                عرض تفاصيل المنتج
            </label>
            <select
                id="product-selector"
                value={selectedProductId || ''}
                onChange={(e) => handleProductSelectionChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                {customer.products.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.name} - (أضيف في: {new Date(p.createdAt).toLocaleDateString('ar-IQ')})
                    </option>
                ))}
            </select>
        </div>
      )}

      {selectedProduct ? (() => {
        const product = selectedProduct;
        const installmentsPaid = product.installments.reduce((sum, i) => sum + i.amountPaid, 0);
        const paidAmount = product.downPayment + installmentsPaid;
        const remainingAmount = product.totalPrice - paidAmount;
        const progress = product.totalPrice > 0 ? (paidAmount / product.totalPrice) * 100 : 0;
        
        const isEditingThisProduct = editingProduct?.id === product.id;
        const portalLink = `${window.location.origin}${window.location.pathname}#/portal/${product.portalId}`;

        const productInstallmentIds = product.installments.map(i => i.id);
        const areAllInProductSelected = productInstallmentIds.length > 0 && productInstallmentIds.every(id => selectedInstallments.has(id));


        return (
          <div key={product.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
             {isEditingThisProduct ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold dark:text-gray-100">تعديل تفاصيل الشراء</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المنتج (لهذه الصفقة)</label>
                        <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صورة المنتج (لهذه الصفقة)</label>
                      <div className="mt-1 flex items-center space-x-reverse space-x-4">
                        {editedPhoto ? <img src={editedPhoto} alt="معاينة" className="h-16 w-16 rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-gray-100 dark:bg-gray-700"></div>}
                        <input type="file" accept="image/*" onChange={handleProductPhotoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-700 dark:file:text-teal-200 dark:hover:file:bg-teal-600" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleCancelEdit} className="bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">إلغاء</button>
                        <button onClick={() => handleSaveEdit(product.id)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">حفظ التعديلات</button>
                    </div>
                </div>
             ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="flex items-center gap-4">
                      {product.productPhoto && (
                        <img src={product.productPhoto} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                      )}
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{product.name}</h2>
                        {product.planName && (
                            <span className="mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 self-start">{product.planName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
                        <button onClick={() => handleEditProduct(product)} className="flex items-center text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            <PencilIcon className="h-4 w-4 ml-2" />
                            تعديل
                        </button>
                        <button onClick={() => setShowPrintView(product)} className="flex items-center text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            <PrinterIcon className="h-4 w-4 ml-2" />
                            طباعة وصل
                        </button>
                        <button onClick={() => onDeleteProduct(customer.id, product.id)} className="flex items-center text-sm bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-3 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors">
                            <TrashIcon className="h-4 w-4 ml-2" />
                            حذف المنتج
                        </button>
                    </div>
                </div>
                 
                {product.portalId && (
                    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border dark:border-gray-700">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">رابط الزبون:</label>
                        <input 
                            type="text" 
                            readOnly 
                            value={portalLink}
                            className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm text-gray-500 dark:text-gray-300 w-full"
                            onFocus={(e) => e.target.select()}
                        />
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(portalLink);
                                setCopiedLink(product.portalId);
                                setTimeout(() => setCopiedLink(null), 2000);
                            }}
                            className={`flex items-center justify-center w-full sm:w-auto text-sm px-4 py-2 rounded-lg transition-colors font-semibold ${
                                copiedLink === product.portalId
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                    : 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-900'
                            }`}
                            disabled={copiedLink === product.portalId}
                        >
                            {copiedLink === product.portalId ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 ml-2" />
                                    <span>تم النسخ!</span>
                                </>
                            ) : (
                                <>
                                    <ClipboardIcon className="h-4 w-4 ml-2" />
                                    <span>نسخ</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
                    <div><span className="block text-sm text-gray-500 dark:text-gray-400">السعر الكلي</span><span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(product.totalPrice, settings.currency)}</span></div>
                    <div><span className="block text-sm text-gray-500 dark:text-gray-400">المقدّم</span><span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(product.downPayment, settings.currency)}</span></div>
                    <div><span className="block text-sm text-gray-500 dark:text-gray-400">مجموع الأقساط المدفوعة</span><span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(installmentsPaid, settings.currency)}</span></div>
                    <div><span className="block text-sm text-gray-500 dark:text-gray-400">المبلغ المتبقي</span><span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(remainingAmount, settings.currency)}</span></div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                  <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">جدول الأقساط ({product.installmentsCount})</h3>
                  {!showAddPurchaseModal && (
                    <button
                      onClick={() => setAddingInstallmentTo(product.id)}
                      disabled={!!addingInstallmentTo || !!editingInstallmentId}
                      className="flex items-center text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                    >
                      <PlusIcon className="h-4 w-4 ml-1" />
                      إضافة قسط
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-2 py-3">
                          <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            title="تحديد الكل لهذا المنتج"
                            checked={areAllInProductSelected}
                            onChange={() => handleSelectAllForProduct(product)}
                            disabled={!!editingInstallmentId}
                          />
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">تاريخ الاستحقاق</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المبلغ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الحالة</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {product.installments.map(installment => {
                        const isEditing = editingInstallmentId === installment.id;
                        return (
                        <tr key={installment.id} className={isEditing ? 'bg-teal-50 dark:bg-teal-900/30' : installment.status === 'paid' ? 'bg-green-50/70 dark:bg-green-900/40' : installment.status === 'partially_paid' ? 'bg-yellow-50/70 dark:bg-yellow-900/40' : ''}>
                          <td className="px-2 py-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                checked={selectedInstallments.has(installment.id)}
                                onChange={() => handleSelectInstallment(installment.id)}
                                aria-label={`تحديد قسط ${installment.id}`}
                                disabled={!!editingInstallmentId}
                            />
                          </td>
                          {isEditing ? (
                            <>
                              <td className="px-2 py-1 whitespace-nowrap">
                                <input
                                  type="date"
                                  value={editedInstallmentData.dueDate}
                                  onChange={(e) => setEditedInstallmentData(prev => ({...prev, dueDate: e.target.value}))}
                                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                />
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={editedInstallmentData.amount}
                                  onChange={(e) => setEditedInstallmentData(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-sm"
                                />
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {getStatusBadge(installment.status)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleSaveInstallment(product.id)} title="حفظ"><CheckCircleIcon className="h-6 w-6 text-green-500 hover:text-green-700" /></button>
                                  <button onClick={handleCancelEditInstallment} title="إلغاء"><XCircleIcon className="h-6 w-6 text-red-500 hover:text-red-700" /></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{new Date(installment.dueDate).toLocaleDateString('ar-IQ')}</td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(installment.amount, settings.currency)}</div>
                                {installment.status === 'partially_paid' && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        المدفوع: {formatCurrency(installment.amountPaid, settings.currency)}
                                    </div>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {getStatusBadge(installment.status)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-2">
                                    {installment.status !== 'paid' && (
                                        <button onClick={() => setPaymentModalInfo({ product, installment })} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" title="تسجيل دفعة">
                                            <PlusIcon className="h-6 w-6 text-green-500 hover:text-green-700" />
                                        </button>
                                    )}
                                    {installment.status !== 'paid' && (
                                        <button 
                                            onClick={() => handleSendWhatsApp(customer, product, installment)} 
                                            className="p-1 text-green-600 hover:text-green-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            title="إرسال تذكير عبر واتساب"
                                        >
                                            <WhatsAppIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {installment.status === 'paid' && (
                                        <button 
                                            onClick={() => handleSendWhatsAppConfirmation(customer, product, installment)} 
                                            className="p-1 text-green-600 hover:text-green-800 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            title="إرسال تأكيد دفع عبر واتساب"
                                        >
                                            <WhatsAppIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    <button onClick={() => handleStartEditInstallment(installment)} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" title="تعديل القسط">
                                      <PencilIcon className="h-5 w-5 text-gray-500 hover:text-teal-600" />
                                    </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
                {addingInstallmentTo === product.id && (
                  <InstallmentForm
                    onAddInstallment={(installment) => handleAddInstallment(product.id, installment)}
                    onCancel={() => setAddingInstallmentTo(null)}
                  />
                )}
              </>
             )}
          </div>
        );
      })() : (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500 dark:text-gray-400">لا توجد منتجات مسجلة لهذا الزبون.</p>
        </div>
      )}

      {selectedInstallments.size > 0 && (
          <div className="sticky bottom-4 z-20 max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm p-3 rounded-lg shadow-lg border dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                      {selectedInstallments.size} أقساط محددة
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                      <button
                          onClick={() => handleBulkUpdate('paid')}
                          disabled={!!editingInstallmentId}
                          className="flex-1 sm:flex-auto bg-green-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-600 transition-colors disabled:bg-gray-400"
                      >
                          تحديد كـ "مدفوع"
                      </button>
                      <button
                          onClick={() => handleBulkUpdate('partially_paid')}
                          disabled={!!editingInstallmentId}
                          className="flex-1 sm:flex-auto bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
                      >
                          تحديد كـ "مدفوع جزئياً"
                      </button>
                       <button
                          onClick={() => setSelectedInstallments(new Set())}
                          disabled={!!editingInstallmentId}
                          className="flex-1 sm:flex-auto bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-400"
                      >
                          إلغاء التحديد
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <div className="text-center">
          <button onClick={() => setShowAddPurchaseModal(true)} disabled={!!addingInstallmentTo || !!editingProduct || isEditingCustomer || !!editingInstallmentId} className="flex items-center justify-center w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow text-lg font-semibold disabled:bg-gray-400">
              <PlusIcon className="h-6 w-6 ml-2" />
              إضافة منتج/بضاعة جديدة
          </button>
      </div>

    </div>
  );
};

export default InstallmentDetails;