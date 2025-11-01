import React, { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell';
import { useSettings } from '../contexts/SettingsContext';
import { DollarSignIcon, PackageIcon, MoonIcon, SunIcon, BarChartIcon, UsersIcon, UserCircleIcon, ShieldCheckIcon, LogOutIcon, HelpCircleIcon, InfoIcon } from './icons';
import { Customer, User } from '../types';

interface HeaderProps {
  onNavigate: (view: 'dashboard' | 'products' | 'expenses' | 'reports' | 'profile' | 'admin' | 'support' | 'about') => void;
  customers: Customer[];
  user: User | undefined | null;
  onLogout: () => void;
}

const CurrencySwitcher: React.FC = () => {
    const { settings, setCurrency } = useSettings();

    const toggleCurrency = () => {
        setCurrency(settings.currency === 'IQD' ? 'USD' : 'IQD');
    };
    
    const currencyText = settings.currency === 'IQD' ? 'د.ع' : '$';

    return (
        <button
            onClick={toggleCurrency}
            className="w-full flex items-center justify-between text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            title={`تغيير العملة إلى ${settings.currency === 'IQD' ? 'الدولار الأمريكي' : 'الدينار العراقي'}`}
        >
            <span className="flex items-center">
                <DollarSignIcon className="w-5 h-5 ml-2" />
                <span>العملة</span>
            </span>
            <span className="font-semibold">{currencyText}</span>
        </button>
    );
};

const ThemeSwitcher: React.FC = () => {
    const { settings, toggleTheme } = useSettings();

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            title={settings.theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع الفاتح'}
        >
            <span className="flex items-center">
                 {settings.theme === 'light' ? <MoonIcon className="w-5 h-5 ml-2" /> : <SunIcon className="w-5 h-5 ml-2" />}
                <span>المظهر</span>
            </span>
            <span className="text-xs font-medium">{settings.theme === 'light' ? 'فاتح' : 'داكن'}</span>
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ onNavigate, customers, user, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavigate = (view: 'profile' | 'admin' | 'support' | 'about') => {
      onNavigate(view);
      setIsProfileMenuOpen(false);
  }


  return (
    <header className="bg-white dark:bg-gray-800 shadow-md print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="flex-shrink-0 flex items-center gap-2 text-2xl font-bold text-teal-600 dark:text-teal-400">
              <img src="/assets/logo.svg" alt="شعار إدارة الأقساط" className="h-8 w-8" />
              <span>إدارة الأقساط</span>
            </button>
             <nav className="hidden md:flex items-center gap-1 border-r pr-2 border-gray-200 dark:border-gray-700">
               <button onClick={() => onNavigate('dashboard')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <UsersIcon className="w-5 h-5 ml-2" />
                 <span>الزبائن</span>
               </button>
               <button onClick={() => onNavigate('products')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <PackageIcon className="w-5 h-5 ml-2" />
                 <span>المنتجات</span>
               </button>
               <button onClick={() => onNavigate('expenses')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <DollarSignIcon className="w-5 h-5 ml-2" />
                 <span>المصروفات</span>
               </button>
               <button onClick={() => onNavigate('reports')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <BarChartIcon className="w-5 h-5 ml-2" />
                 <span>التقارير</span>
               </button>
               <button onClick={() => onNavigate('support')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <HelpCircleIcon className="w-5 h-5 ml-2" />
                 <span>الدعم</span>
               </button>
               <button onClick={() => onNavigate('about')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 <InfoIcon className="w-5 h-5 ml-2" />
                 <span>حول البرنامج</span>
               </button>
               {user?.role === 'admin' && (
                 <button onClick={() => onNavigate('admin')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                   <ShieldCheckIcon className="w-5 h-5 ml-2" />
                   <span>لوحة التحكم</span>
                 </button>
               )}
             </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell customers={customers} />
             <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="الملف الشخصي"
              >
                <UserCircleIcon className="w-6 h-6" />
              </button>
              
              {isProfileMenuOpen && (
                <div className="origin-top-left absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-20">
                  <div className="p-2" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                    <div className="px-2 py-2">
                      <p className="text-sm text-gray-900 dark:text-white" role="none">مرحباً بك, <span className="font-bold">{user ? user.email : 'يا ضيف'}</span></p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                        onClick={() => handleNavigate('profile')}
                        className="w-full flex items-center text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        role="menuitem"
                    >
                       <UserCircleIcon className="w-5 h-5 ml-2" />
                       الملف الشخصي والإعدادات
                    </button>
                    <button
                        onClick={() => handleNavigate('support')}
                        className="w-full flex items-center text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        role="menuitem"
                    >
                       <HelpCircleIcon className="w-5 h-5 ml-2" />
                       الدعم الفني
                    </button>
                    <button
                        onClick={() => handleNavigate('about')}
                        className="w-full flex items-center text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        role="menuitem"
                    >
                       <InfoIcon className="w-5 h-5 ml-2" />
                       حول البرنامج
                    </button>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => handleNavigate('admin')}
                            className="w-full flex items-center text-right p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            role="menuitem"
                        >
                           <ShieldCheckIcon className="w-5 h-5 ml-2" />
                           لوحة التحكم
                        </button>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <ThemeSwitcher />
                    <CurrencySwitcher />
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                     <button
                        onClick={onLogout}
                        className="w-full flex items-center text-right p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
                        role="menuitem"
                    >
                       <LogOutIcon className="w-5 h-5 ml-2" />
                       تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;