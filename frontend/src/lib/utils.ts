import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: uk });
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy, HH:mm', { locale: uk });
}

// feeAmount stored in minor units (1/100 of currency unit)
export function formatFee(amount: number, currency: string = 'UAH'): string {
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
