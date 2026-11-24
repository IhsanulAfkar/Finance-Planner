'use client';
import { httpClient } from '@/lib/httpClient';
import { buildUrl } from '@/lib/utils';
import type { ReportSelection } from '@/lib/reportRange';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export type TReportInsight = {
  title: string;
  description: string;
  type: string;
};

export type TReportInsightMeta = {
  period: ReportSelection['period'];
  selection: {
    date: string | null;
    month: string | null;
    year: number | null;
  };
  currentRange: { start: string; end: string };
  previousRange: { start: string; end: string };
  income: { current: number; last: number; growth: number };
  expense: { current: number; last: number; growth: number };
  netCashflow: { current: number; last: number };
  savingsRate: { current: number; last: number; diff: number };
  expenseFrequency: {
    current: { count: number; average: number };
    last: { count: number; average: number };
  };
  recentExpenseTrend: { firstHalf: number; secondHalf: number; change: number };
  topCategories: { name: string; amount: number; percentage: number }[];
};

const useReportInsight = (selection: ReportSelection) => {
  const { period, date, month, year } = selection;
  const params =
    period === 'day' || period === 'week'
      ? { period, date }
      : period === 'month'
        ? { period, month }
        : { period, year };

  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['report-insight', period, date, month, year],
    queryFn: async () => {
      return httpClient.get<{
        data: TReportInsight[];
        meta: TReportInsightMeta;
      }>(buildUrl('/report/insight', params));
    },
  });

  if (error) {
    console.log(error);
    toast.error('Server Error');
  }

  return {
    data: response?.data.data ?? [],
    meta: response?.data.meta,
    status: response?.status,
    error,
    isLoading,
    refetch,
  };
};

export default useReportInsight;
