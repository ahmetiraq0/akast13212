import React, { useState, useMemo } from 'react';
import { CatalogProduct } from '../types';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, PencilIcon, TrashIcon, PackageIcon } from './icons';
import ProductForm from './ProductForm';
import { useSettings } from '../contexts/SettingsContext';

interface ProductsPageProps {
  products: CatalogProduct[];
  onAddProduct: (productData: Omit<CatalogProduct, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

const Modal: React.FC<{onClose: () => void, children: React.ReactNode}> = ({ onClose, children }) => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
);

const ProductsPage: React.FC<ProductsPageProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { settings } = useSettings();

  const handleOpenModal = (product?: CatalogProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProduct(undefined);
    setIsModalOpen(false);
  };

  const handleSaveProduct = (productData: Omit<CatalogProduct, 'id' | 'createdAt'> | CatalogProduct) => {
    if ('id' in productData) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    handleCloseModal();
  };
  
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category).filter((c): c is string => !!c));
    return ['all', ...Array.from(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
        return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const categoryTranslations: { [key: string]: string } = {
    'all': 'كل الفئات'
  };

  return (
    <div className="space-y-6">
       {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <ProductForm 
            onSave={handleSaveProduct}
            onCancel={handleCloseModal}
            existingProduct={editingProduct}
          />
        </Modal>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center">
                <PackageIcon className="w-8 h-8 text-teal-600 dark:text-teal-400 ml-3" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">إدارة المنتجات</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">إضافة وتعديل المنتجات في الكتالوج الخاص بك.</p>
                </div>
            </div>
            <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center mt-4 sm:mt-0 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow"
            >
                <PlusIcon className="h-5 w-5 ml-2" />
                <span>إضافة منتج جديد</span>
            </button>
        </div>
      </div>
     
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <div className="flex items-center gap-4 mb-4">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">تصفية حسب الفئة:</label>
            <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>
                        {categoryTranslations[cat] || cat}
                    </option>
                ))}
            </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المنتج</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الفئة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">السعر الكلي</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تاريخ الإضافة</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length > 0 ? filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.productPhoto ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={product.productPhoto} alt={product.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <PackageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                            {product.category}
                        </span>
                    ) : (
                        <span className="text-xs">بدون فئة</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {formatCurrency(product.totalPrice, settings.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString('ar-IQ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-reverse space-x-2">
                    <button onClick={() => handleOpenModal(product)} className="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300" title="تعديل">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="حذف">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    لم يتم إضافة أي منتجات بعد أو لا توجد منتجات مطابقة للتصفية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;