import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto'
import moment from 'moment'

import dayjs from 'dayjs';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatDatetoISO = (date?: Date | string, withTime = false) => {
  if (!date) return null;

  const d = new Date(date);

  const year = d.getFullYear(); // ✅ local year
  const month = String(d.getMonth() + 1).padStart(2, '0'); // ✅ local month
  const day = String(d.getDate()).padStart(2, '0'); // ✅ local day

  if (!withTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(d.getHours()).padStart(2, '0'); // ✅ local hours
  const minutes = String(d.getMinutes()).padStart(2, '0'); // ✅ local minutes

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
export const dateFormat = (
  dateString: string | null | undefined | Date = '',
  format: string = 'MMM D, YYYY HH:mm',
  noParseUtc?: boolean,
) => {
  const date = noParseUtc ? moment(dateString) : moment.utc(dateString);
  return date.isValid() ? date.format(format) : '-';
};

export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const query = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    }
  }

  const queryString = query.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export const withBasePath = (path: string) => {
  const bp = process.env.NEXT_PUBLIC_BASEPATH || '';
  if (!bp) return path;
  return `${bp}${path.startsWith('/') ? path : `/${path}`}`;
};
export const generateCode = () => crypto.randomInt(100000, 999999).toString()

export const formatIDR = (value: number | string) => {
  if (value == null) return ''
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export const isToday = (input: string) => {
  return dayjs(input).isSame(dayjs(), 'day')
};
export const isSameMonth = (input: string) => {
  return dayjs(input).isSame(dayjs(), 'month')
};
export const calculateProgress = (current: number, target: number) => {
  return Math.min((current / target) * 100, 100);
};

export const calculateMonthsRemaining = (targetDate: string) => {
  const target = new Date(targetDate);
  const today = new Date();
  const months = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
  return Math.max(months, 0);
};
export const getMonthRanges = (date?: string) => {
  const base = date ? new Date(date) : new Date();

  const currentStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const currentEnd = new Date(base.getFullYear(), base.getMonth() + 1, 1);

  const lastStart = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const lastEnd = new Date(base.getFullYear(), base.getMonth(), 1);

  return {
    current: { start: currentStart, end: currentEnd },
    last: { start: lastStart, end: lastEnd },
  };
}