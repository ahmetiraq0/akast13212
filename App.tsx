import React, { useState, useMemo, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Customer, Product, CatalogProduct, DailyReminderLog, Expense, UserProfile, User } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CustomerForm from './components/CustomerForm';
import InstallmentDetails from './components/InstallmentDetails';
import Reports from './components/Reports';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';
import { SettingsProvider, useSettings, SoundType } from './contexts/SettingsContext';
import ProductsPage from './components/ProductsPage';
import CustomerPortal from './components/CustomerPortal';
import ReminderManager from './components/ReminderManager';
import ExpensesPage from './components/ExpensesPage';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import TrialExpired from './components/TrialExpired';
import SupportPage from './components/SupportPage';
import AboutPage from './components/AboutPage';
import ExpenseNotifier from './components/ExpenseNotifier';
import { AlertTriangleIcon } from './components/icons';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type View = 'dashboard' | 'addCustomer' | 'viewCustomer' | 'reports' | 'products' | 'expenses' | 'profile' | 'admin' | 'support' | 'about';

const AppContent: React.FC = () => {
  // App Data State (remains in local storage)
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [catalogProducts, setCatalogProducts] = useLocalStorage<CatalogProduct[]>('catalogProducts', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [dailyReminderLog, setDailyReminderLog] = useLocalStorage<DailyReminderLog>('dailyReminderLog', { date: '', reminders: [] });
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', {
    shopInfo: { name: 'اسم المحل', address: 'العنوان', phone: 'رقم الهاتف', logo: '' }
  });

  // User and Session State (now managed by Firebase)
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [isGuest, setIsGuest] = useLocalStorage<boolean>('isGuest', false);

  // App View State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const { settings, playSound } = useSettings();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as User);
        } else {
          console.error("User document not found in Firestore for UID:", firebaseUser.uid);
          await signOut(auth); // Sign out if profile is missing
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);
  
  // Trial logic
  const trialInfo = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.isActive) {
      return { onTrial: false, isExpired: false, daysLeft: 0 };
    }
    const createdAt = new Date(currentUser.createdAt);
    const trialEndsAt = new Date(new Date(currentUser.createdAt).setDate(createdAt.getDate() + 30));
    const now = new Date();
    const isExpired = now > trialEndsAt;
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { onTrial: true, isExpired, daysLeft: daysLeft > 0 ? daysLeft : 0 };
  }, [currentUser]);

  // Handle dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Modal and Toast State
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmButtonText: undefined as string | undefined, confirmButtonClass: undefined as string | undefined });
  const [toast, setToast] = useState({ isVisible: false, message: '' });
  
  // Customer Portal Logic
  const portalProductInfo = useMemo(() => {
    const portalIdMatch = window.location.hash.match(/^#\/portal\/([\w-]+)/);
    if (!portalIdMatch) return null;
    const portalId = portalIdMatch[1];
    for (const customer of customers) {
      const product = customer.products.find(p => p.portalId === portalId);
      if (product) return { customer, product };
    }
    return null; 
  }, [customers]);

  // Authentication and Authorization Routing
  if (portalProductInfo) {
    return <CustomerPortal customer={portalProductInfo.customer} product={portalProductInfo.product} />;
  }

  const handleLogout = async () => {
    await signOut(auth);
    setIsGuest(false);
  };

  // Loading state while Firebase checks auth
  if (currentUser === undefined && !isGuest) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">جار التحميل...</div>
        </div>
      );
  }

  if (!isGuest && !currentUser) {
    return <AuthPage setIsGuest={setIsGuest} />;
  }
  
  if (currentUser && trialInfo.isExpired) {
    return <TrialExpired user={currentUser} onLogout={handleLogout} />;
  }

  // Helper functions (Toast, CRUD operations)
  const showToast = (message: string, soundType?: SoundType) => { if (soundType) { playSound(soundType); } if (message) { setToast({ isVisible: true, message }); setTimeout(() => { setToast({ isVisible: false, message: '' }); }, 3000); } };
  const addCustomer = (customer: Omit<Customer, 'id' | 'products' | 'createdAt'>) => { const newCustomer: Customer = { ...customer, id: `cust_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, products: [], createdAt: new Date().toISOString(), }; setCustomers(prev => [...prev, newCustomer]); setCurrentView('dashboard'); showToast('تم إضافة الزبون بنجاح!', 'add'); };
  const updateCustomer = (updatedCustomer: Customer) => { setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)); showToast('تم تحديث بيانات الزبون!', 'success'); }
  const deleteCustomer = (customerId: string) => { const customerToDelete = customers.find(c => c.id === customerId); if (!customerToDelete) return; setModalState({ isOpen: true, title: `حذف الزبون ${customerToDelete.fullName}`, message: 'هل أنت متأكد من حذف هذا الزبون وجميع بياناته؟ لا يمكن التراجع عن هذا الإجراء.', onConfirm: () => { setCustomers(prev => prev.filter(c => c.id !== customerId)); setCurrentView('dashboard'); setSelectedCustomerId(null); showToast('تم حذف الزبون بنجاح.', 'delete'); }, confirmButtonText: 'تأكيد الحذف', confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' }); };
  const addProductToCustomer = (customerId: string, product: Omit<Product, 'id' | 'portalId'>) => { const portalId = 'p' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9); const newProduct: Product = { ...product, id: `prod_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, portalId }; setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, products: [...c.products, newProduct] } : c) ); showToast('تم إضافة المنتج للزبون بنجاح!', 'add'); };
  const deleteProductFromCustomer = (customerId: string, productId: string) => { const customer = customers.find(c => c.id === customerId); const product = customer?.products.find(p => p.id === productId); if (!product) return; setModalState({ isOpen: true, title: `حذف المنتج ${product.name}`, message: 'هل أنت متأكد من حذف هذا المنتج وجميع أقساطه؟ لا يمكن التراجع عن هذا الإجراء.', onConfirm: () => { setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, products: c.products.filter(p => p.id !== productId) } : c ) ); showToast('تم حذف المنتج بنجاح.', 'delete'); }, confirmButtonText: 'تأكيد الحذف', confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' }); };
  const addCatalogProduct = (productData: Omit<CatalogProduct, 'id' | 'createdAt'>) => { const newProduct: CatalogProduct = { ...productData, id: `cat_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString(), }; setCatalogProducts(prev => [...prev, newProduct]); showToast('تم إضافة المنتج للكتالوج بنجاح.', 'add'); };
  const updateCatalogProduct = (updatedProduct: CatalogProduct) => { setCatalogProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)); showToast('تم تحديث المنتج بنجاح.', 'success'); };
  const deleteCatalogProduct = (productId: string) => { const productToDelete = catalogProducts.find(p => p.id === productId); if (!productToDelete) return; setModalState({ isOpen: true, title: `حذف المنتج ${productToDelete.name}`, message: 'هل أنت متأكد من حذف هذا المنتج من الكتالوج؟', onConfirm: () => { setCatalogProducts(prev => prev.filter(p => p.id !== productId)); showToast('تم حذف المنتج من الكتالوج.', 'delete'); }, confirmButtonText: 'تأكيد الحذف', confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' }); };
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => { const newExpense: Expense = { ...expenseData, id: `exp_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString(), }; setExpenses(prev => [newExpense, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())); showToast('تم تسجيل المصروف بنجاح.', 'add'); };
  const updateExpense = (updatedExpense: Expense) => { setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())); showToast('تم تحديث المصروف بنجاح.', 'success'); };
  const deleteExpense = (expenseId: string) => { const expenseToDelete = expenses.find(e => e.id === expenseId); if (!expenseToDelete) return; setModalState({ isOpen: true, title: `حذف المصروف`, message: `هل أنت متأكد من حذف هذا المصروف: "${expenseToDelete.description}"؟`, onConfirm: () => { setExpenses(prev => prev.filter(e => e.id !== expenseId)); showToast('تم حذف المصروف.', 'delete'); }, confirmButtonText: 'تأكيد الحذف', confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' }); };
  const handleViewCustomer = (customerId: string) => { setSelectedCustomerId(customerId); setCurrentView('viewCustomer'); };
  const handleNavigation = (view: View) => { setCurrentView(view); setSelectedCustomerId(null); };
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId) || null, [customers, selectedCustomerId]);
  const closeModal = () => { setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmButtonText: undefined, confirmButtonClass: undefined }); };

  const renderContent = () => {
    switch (currentView) {
      case 'addCustomer': return <CustomerForm onAddCustomer={addCustomer} onCancel={() => handleNavigation('dashboard')} />;
      case 'viewCustomer': return selectedCustomer ? <InstallmentDetails customer={selectedCustomer} catalogProducts={catalogProducts} onUpdateCustomer={updateCustomer} onAddProduct={addProductToCustomer} onDeleteCustomer={deleteCustomer} onDeleteProduct={deleteProductFromCustomer} onShowToast={showToast} onShowConfirmation={setModalState} shopInfo={userProfile.shopInfo} onNavigate={handleNavigation} /> : null;
      case 'reports': return <Reports customers={customers} expenses={expenses} onBack={() => handleNavigation('dashboard')} />;
      case 'products': return <ProductsPage products={catalogProducts} onAddProduct={addCatalogProduct} onUpdateProduct={updateCatalogProduct} onDeleteProduct={deleteCatalogProduct} />;
      case 'expenses': return <ExpensesPage expenses={expenses} onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} />;
      case 'profile': return <ProfilePage user={currentUser} userProfile={userProfile} onUpdateProfile={setUserProfile} customers={customers} expenses={expenses} dailyReminderLog={dailyReminderLog} onNavigate={handleNavigation} />;
      case 'admin': return currentUser?.role === 'admin' ? <AdminPanel onShowConfirmation={setModalState} /> : <Dashboard customers={customers} expenses={expenses} onViewCustomer={handleViewCustomer} onAddCustomerClick={() => handleNavigation('addCustomer')} onNavigateToReports={() => handleNavigation('reports')} onNavigateToProducts={() => handleNavigation('products')} onNavigateToExpenses={() => handleNavigation('expenses')} />;
      case 'support': return <SupportPage />;
      case 'about': return <AboutPage />;
      case 'dashboard': default: return <Dashboard customers={customers} expenses={expenses} onViewCustomer={handleViewCustomer} onAddCustomerClick={() => handleNavigation('addCustomer')} onNavigateToReports={() => handleNavigation('reports')} onNavigateToProducts={() => handleNavigation('products')} onNavigateToExpenses={() => handleNavigation('expenses')} />;
    }
  };

  return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
        <ReminderManager customers={customers} setModalState={setModalState} showToast={showToast} dailyReminderLog={dailyReminderLog} setDailyReminderLog={setDailyReminderLog} />
        <ExpenseNotifier expenses={expenses} showToast={showToast} />
        <Header onNavigate={handleNavigation} customers={customers} user={currentUser} onLogout={handleLogout} />
        {trialInfo.onTrial && trialInfo.daysLeft <= 3 && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 border-b border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-center text-sm">
                <AlertTriangleIcon className="inline w-4 h-4 ml-2" />
                تحذير: ستنتهي فترة التجربة الخاصة بك خلال {trialInfo.daysLeft} أيام.
            </div>
        )}
         {isGuest && (
            <div className="bg-blue-100 dark:bg-blue-900/50 border-b border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-2 text-center text-sm">
                أنت تتصفح حالياً كـ <span className="font-bold">ضيف</span>. لإنشاء حساب وحفظ بياناتك، قم بتسجيل الخروج ثم إنشاء حساب جديد.
            </div>
        )}
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
        <ConfirmationModal isOpen={modalState.isOpen} onClose={closeModal} onConfirm={modalState.onConfirm} title={modalState.title} message={modalState.message} confirmButtonText={modalState.confirmButtonText} confirmButtonClass={modalState.confirmButtonClass} />
        <Toast message={toast.message} isVisible={toast.isVisible} />
      </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;