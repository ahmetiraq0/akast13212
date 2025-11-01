import React, { useState, useMemo } from 'react';
import { UserProfile, Customer, Expense, DailyReminderLog, User, Settings } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { UserCircleIcon, Volume2Icon, VolumeXIcon, BarChartIcon, UsersIcon, CreditCardIcon, ClipboardIcon, CheckCircleIcon, StarIcon, BellIcon } from './icons';
import BackupRestore from './BackupRestore';
import DashboardCharts from './DashboardCharts';
import TodaysReminders from './TodaysReminders';

interface ProfilePageProps {
  user: User | undefined | null;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  customers: Customer[];
  expenses: Expense[];
  dailyReminderLog: DailyReminderLog;
  onNavigate: (view: 'support') => void;
}

const SoundToggle: React.FC = () => {
    const { settings, toggleSoundEffects } = useSettings();
    return (
        <button 
            onClick={toggleSoundEffects}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title={settings.soundEffects ? 'إيقاف الصوت' : 'تشغيل الصوت'}
        >
            {settings.soundEffects ? <Volume2Icon className="w-6 h-6 text-teal-500" /> : <VolumeXIcon className="w-6 h-6 text-gray-500" />}
            <span className="font-medium">{settings.soundEffects ? 'المؤثرات الصوتية مفعلة' : 'المؤثرات الصوتية معطلة'}</span>
        </button>
    )
}

const OverviewStats: React.FC<{ customers: Customer[] }> = ({ customers }) => {
    const summaryStats = useMemo(() => {
        const totalCustomers = customers.length;
        let outstandingInstallments = 0;

        customers.forEach(customer => {
            customer.products.forEach(product => {
                outstandingInstallments += product.installments.filter(
                    inst => inst.status !== 'paid'
                ).length;
            });
        });

        return { totalCustomers, outstandingInstallments };
    }, [customers]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي عدد الزبائن</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{summaryStats.totalCustomers}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                <CreditCardIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الأقساط غير المكتملة</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{summaryStats.outstandingInstallments}</p>
              </div>
            </div>
        </div>
    );
};


const ProfilePage: React.FC<ProfilePageProps> = ({ user, userProfile, onUpdateProfile, customers, expenses, dailyReminderLog, onNavigate }) => {
  const [shopInfo, setShopInfo] = useState(userProfile.shopInfo);
  const [copied, setCopied] = useState(false);
  const { settings, updateSettings } = useSettings();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopInfo(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ ...userProfile, shopInfo });
    alert('تم حفظ التغييرات بنجاح!');
  };
  
  const handleSettingsChange = (key: keyof Settings, value: string | number | boolean) => {
    updateSettings({ [key]: value });
  };

  const handleCopyUid = () => {
    if (user) {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <UserCircleIcon className="w-10 h-10 text-teal-600 dark:text-teal-400 ml-4" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">الملف الشخصي والإعدادات</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">إدارة معلومات محلك وتفضيلات التطبيق.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">معلومات المحل</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المحل</label>
                    <input type="text" name="name" value={shopInfo.name} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الهاتف</label>
                    <input type="text" name="phone" value={shopInfo.phone} onChange={handleInputChange} className="mt-1 block w-full input-style" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العنوان</label>
                <input type="text" name="address" value={shopInfo.address} onChange={handleInputChange} className="mt-1 block w-full input-style" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">شعار المحل</label>
                <div className="mt-1 flex items-center gap-4">
                    {shopInfo.logo && <img src={shopInfo.logo} alt="الشعار الحالي" className="h-16 w-16 rounded-md object-contain bg-gray-100 dark:bg-gray-700 p-1" />}
                     <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-700 dark:file:text-teal-200 dark:hover:file:bg-teal-600" />
                </div>
            </div>
             <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">حفظ معلومات المحل</button>
            </div>
          </div>
        </div>
      </form>

      {user && user.role !== 'admin' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">معلومات الحساب</h2>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">اسم المستخدم / البريد الإلكتروني</label>
                      <p className="mt-1 text-gray-900 dark:text-gray-100 font-semibold">{user.email}</p>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">المعرّف الخاص بك (UID)</label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">استخدم هذا المعرّف عند التواصل مع الدعم الفني أو لتفعيل حسابك.</p>
                      <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                          <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono truncate">{user.id}</pre>
                          <button
                              type="button"
                              onClick={handleCopyUid}
                              className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                              title="نسخ المعرف"
                          >
                              {copied ? <CheckCircleIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {user && user.role !== 'admin' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">خطط الاشتراك</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">اختر الخطة التي تناسبك لتفعيل حسابك والاستمتاع بكامل الميزات.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Monthly Plan */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">الخطة الشهرية</h3>
                    <p className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-gray-100">$10<span className="text-base font-medium text-gray-500 dark:text-gray-400"> / شهرياً</span></p>
                    <ul role="list" className="mt-6 space-y-4 flex-grow text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>عدد غير محدود من العملاء</span></li>
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>عدد غير محدود من المنتجات</span></li>
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>تقارير مالية مفصلة</span></li>
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>دعم فني عبر واتساب</span></li>
                    </ul>
                    <button onClick={() => onNavigate('support')} className="mt-8 w-full bg-teal-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-teal-700 transition">اختر الخطة</button>
                </div>

                {/* Annual Plan (Most Popular) */}
                <div className="relative border-2 border-teal-500 rounded-lg p-6 flex flex-col">
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-3 py-1 text-sm font-semibold tracking-wide rounded-full shadow-md flex items-center gap-1">
                        <StarIcon className="w-4 h-4" />
                        الأكثر شيوعاً
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">الخطة السنوية</h3>
                    <p className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-gray-100">$100<span className="text-base font-medium text-gray-500 dark:text-gray-400"> / سنوياً</span></p>
                    <ul role="list" className="mt-6 space-y-4 flex-grow text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>جميع ميزات الخطة الشهرية</span></li>
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>خصم 20% (توفير شهرين)</span></li>
                        <li className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-green-500" /><span>أولوية في الدعم الفني</span></li>
                    </ul>
                    <button onClick={() => onNavigate('support')} className="mt-8 w-full bg-teal-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-teal-700 transition">اختر الخطة</button>
                </div>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                للتفعيل، يرجى اختيار الخطة والتواصل معنا عبر صفحة <button onClick={() => onNavigate('support')} className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">الدعم الفني</button>.
            </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
         <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">إعدادات التطبيق</h2>
         <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
            <p className="text-gray-700 dark:text-gray-300">تفعيل/إيقاف الأصوات عند إضافة أو تعديل العناصر.</p>
            <SoundToggle />
         </div>
      </div>
      
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <BellIcon className="w-6 h-6 ml-2 text-yellow-500" />
          إعدادات إشعارات المصروفات
        </h2>
        <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">تنبيه عند تجاوز المصروفات</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إرسال تنبيه عند تجاوز إجمالي مصروفات الشهر حداً معيناً.</p>
                </div>
                <input
                    type="checkbox"
                    checked={settings.expenseThresholdEnabled}
                    onChange={(e) => handleSettingsChange('expenseThresholdEnabled', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
            </div>
            {settings.expenseThresholdEnabled && (
                <div className="pl-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ الحد ({settings.currency})</label>
                    <input 
                        type="number"
                        value={settings.expenseThresholdAmount}
                        onChange={(e) => handleSettingsChange('expenseThresholdAmount', parseFloat(e.target.value) || 0)}
                        className="mt-1 block w-full input-style"
                    />
                </div>
            )}
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">تذكير بالمصروفات المتكررة</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">إرسال تذكير قبل موعد استحقاق المصروفات الدورية.</p>
                </div>
                <input
                    type="checkbox"
                    checked={settings.recurringExpenseReminderEnabled}
                    onChange={(e) => handleSettingsChange('recurringExpenseReminderEnabled', e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
            </div>
            {settings.recurringExpenseReminderEnabled && (
                <div className="pl-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">التذكير قبل (أيام) من تاريخ الاستحقاق</label>
                    <input 
                        type="number"
                        min="0"
                        value={settings.recurringExpenseReminderDays}
                        onChange={(e) => handleSettingsChange('recurringExpenseReminderDays', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full input-style"
                    />
                </div>
            )}
        </div>
      </div>

      <BackupRestore />
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <BarChartIcon className="w-8 h-8 text-teal-600 dark:text-teal-400 ml-3" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">نظرة عامة على البيانات</h2>
        </div>
        <OverviewStats customers={customers} />
        <DashboardCharts customers={customers} expenses={expenses} />
      </div>

      <TodaysReminders reminders={dailyReminderLog.reminders} />

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

export default ProfilePage;