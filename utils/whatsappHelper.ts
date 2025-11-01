import { Customer, Product, Installment, Currency } from '../types';
import { formatCurrency } from './formatters';

export const sanitizePhoneNumber = (phone: string): string => {
  let sanitized = phone.replace(/[^0-9]/g, '');
  if (sanitized.startsWith('0')) {
    sanitized = '964' + sanitized.substring(1); // Iraqi country code
  }
  return sanitized;
};

export const generateWhatsAppReminderMessage = (customer: Customer, product: Product, installment: Installment, currency: Currency): string => {
    const dueDateFormatted = new Date(installment.dueDate).toLocaleDateString('ar-IQ');
    const installmentRemainingAmount = installment.amount - installment.amountPaid;
    const amountFormatted = formatCurrency(installmentRemainingAmount, currency);
    const totalPriceFormatted = formatCurrency(product.totalPrice, currency);
    
    const paidInstallmentsCount = product.installments.filter(i => i.status === 'paid').length;
    const remainingInstallmentsCount = product.installments.filter(i => i.status !== 'paid').length;
    
    const sortedInstallments = [...product.installments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const lastInstallment = sortedInstallments.length > 0 ? sortedInstallments[sortedInstallments.length - 1] : null;
    const lastInstallmentDate = lastInstallment ? new Date(lastInstallment.dueDate).toLocaleDateString('ar-IQ') : 'غير محدد';

    const message = `مرحباً ${customer.fullName}،\n\nنود تذكيركم بموعد استحقاق القسط القادم الخاص بـ *${product.name}* (السعر الكلي: ${totalPriceFormatted}).\n\n- المبلغ المتبقي من القسط: ${amountFormatted}\n- تاريخ الاستحقاق: ${dueDateFormatted}\n\n*ملخص الأقساط:*\n- الأقساط المسددة بالكامل: ${paidInstallmentsCount}\n- الأقساط المتبقية (أو المدفوعة جزئياً): ${remainingInstallmentsCount}\n- تاريخ آخر قسط: ${lastInstallmentDate}\n\n*ملاحظة: المقدمة المدفوعة لا تعتبر جزءاً من عدد الأقساط.*\n\nشكراً لتعاونكم.`;
    
    return message;
};

export const generateWhatsAppReminderUrl = (customer: Customer, product: Product, installment: Installment, currency: Currency): string => {
    const message = generateWhatsAppReminderMessage(customer, product, installment, currency);
    const encodedMessage = encodeURIComponent(message);
    const sanitizedPhone = sanitizePhoneNumber(customer.phone);
    return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
};