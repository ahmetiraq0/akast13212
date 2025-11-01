import React from 'react';
import { HelpCircleIcon, WhatsAppIcon } from './icons';

const SupportPage: React.FC = () => {
    const supportPhoneNumber = '07804173219';
    const internationalPhoneNumber = '9647804173219';
    const prefilledMessage = encodeURIComponent('مرحباً، أحتاج إلى مساعدة بخصوص برنامج إدارة الأقساط.');
    const whatsappUrl = `https://wa.me/${internationalPhoneNumber}?text=${prefilledMessage}`;

    const faqs = [
        {
            question: 'كيف يمكنني تفعيل حسابي بعد انتهاء الفترة التجريبية؟',
            answer: 'بعد انتهاء الفترة التجريبية، ستظهر لك شاشة تطلب منك التواصل مع الإدارة. قم بنسخ "المعرف الخاص بك (UID)" من تلك الشاشة وأرسله لنا عبر واتساب لتفعيل حسابك بشكل دائم.'
        },
        {
            question: 'كيف أقوم بعمل نسخة احتياطية من بياناتي؟',
            answer: 'اذهب إلى صفحة "الملف الشخصي والإعدادات"، ستجد قسم "النسخ الاحتياطي والاستعادة". اضغط على "تصدير نسخة احتياطية" لحفظ ملف يحتوي على جميع بياناتك على جهازك.'
        },
        {
            question: 'هل يمكنني استخدام البرنامج على أكثر من جهاز؟',
            answer: 'حالياً، يتم تخزين البيانات محلياً على جهازك. إذا كنت بحاجة إلى مزامنة البيانات عبر أجهزة متعددة، يرجى التواصل معنا لمناقشة الحلول المتاحة.'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
                <HelpCircleIcon className="w-10 h-10 text-teal-600 dark:text-teal-400 ml-4" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">الدعم الفني والمساعدة</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">نحن هنا لمساعدتك. تواصل معنا مباشرة عبر واتساب.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">تواصل فوري عبر واتساب</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">للاستفسارات، طلبات التفعيل، أو أي مساعدة أخرى.</p>
                <p className="my-4 text-3xl font-bold text-teal-600 dark:text-teal-400 tracking-wider font-mono">{supportPhoneNumber}</p>
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-lg text-lg font-semibold"
                >
                    <WhatsAppIcon className="w-6 h-6 ml-3" />
                    <span>تواصل معنا عبر واتساب</span>
                </a>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">أسئلة شائعة</h2>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{faq.question}</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SupportPage;