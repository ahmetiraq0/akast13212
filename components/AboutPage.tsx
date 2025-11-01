import React from 'react';
import { InfoIcon } from './icons';

const AboutPage: React.FC = () => {
    // You can get the version from package.json if it's available in your build process
    // For now, we'll hardcode it.
    const appVersion = "1.0.0"; 

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                <InfoIcon className="w-10 h-10 text-teal-600 dark:text-teal-400 ml-4" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">حول برنامج إدارة الأقساط</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">الإصدار: {appVersion}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <img src="/assets/logo.svg" alt="شعار البرنامج" className="h-24 w-24 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">برنامج إدارة الأقساط</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                    حل متكامل لإدارة ومتابعة أقساط العملاء للمتاجر والمعارض بكل سهولة.
                </p>
                <div className="mt-8">
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        صُنع في العراق ❤️🇮🇶
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        بواسطة فريق متخصص لخدمة أصحاب المتاجر في العراق.
                    </p>
                </div>
            </div>
            
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">الميزات الرئيسية</h2>
                <ul className="space-y-4 text-gray-700 dark:text-gray-300 list-disc list-inside">
                    <li>إدارة بيانات الزبائن ومنتجاتهم وأقساطهم.</li>
                    <li>تتبع الأقساط المدفوعة، غير المدفوعة، والمتأخرة بسهولة.</li>
                    <li>إشعارات وتذكيرات تلقائية للأقساط المستحقة.</li>
                    <li>إنشاء وطباعة وصولات للعملاء.</li>
                    <li>تقارير مالية شاملة لمعرفة أرباحك ومصروفاتك.</li>
                    <li>واجهة سهلة الاستخدام تدعم الوضع الليلي.</li>
                    <li>نسخ احتياطي واستعادة للبيانات لضمان عدم فقدانها.</li>
                    <li>بوابة خاصة للزبون لمتابعة أقساطه.</li>
                </ul>
            </div>
        </div>
    );
};

export default AboutPage;
