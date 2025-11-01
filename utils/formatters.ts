import { Currency } from '../types';

export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
