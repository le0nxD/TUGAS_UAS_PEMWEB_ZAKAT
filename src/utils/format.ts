import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'dd MMMM yyyy', { locale: id });
};

export const formatCurrency = (amount: number | null) => {
  if (amount === null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatHak = (value: number, exchangeRate = 15000) => {
  return value >= 1000 
    ? formatCurrency(value)
    : `${value} kg`;
};