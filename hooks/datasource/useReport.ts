'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
import { toDateInputValue, toMonthInputValue, type ReportSelection } from '@/lib/reportRange';
import { useState } from 'react';
export type TReport = {
  totalIncome: number,
  totalExpense: number,
  totalSavings: number,
  overallSavingsRate: number,
  trend: {
    direction: string,
    rateDiff: number,
    amountDiff: number
  },
  graph: {
    period: string,
    income: number,
    expense: number,
    savings: number,
    savingsRate: number
  } & Record<string, number>[],
  graphMeta: {
    goal: {
      id: number,
      key: string,
      title: string,
      target: number
    }[]
  },
  categories: {
    id: number,
    category: string,
    color: string | null,
    amount: number,
    percentage: number
  }[]
}
export type Period = "day" | "week" | "month" | "year"
const useReport = () => {
  const [period, setPeriod] = useState<Period>('month')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [month, setMonth] = useState(() => toMonthInputValue(new Date()))
  const [year, setYear] = useState(() => new Date().getFullYear())

  const selection: ReportSelection = { period, date, month, year }
  const params =
    period === 'day' || period === 'week'
      ? { period, date }
      : period === 'month'
        ? { period, month }
        : { period, year }

  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['report', period, date, month, year],
    queryFn: async () => {
      return httpClient.get<TReport>(
        buildUrl('/report', params),
      );
    },
  });
  if (error) {
    console.log(error);
    toast.error('Server Error');
  }
  return {
    data: response?.data,
    status: response?.status,
    filter: {
      period, setPeriod,
      date, setDate,
      month, setMonth,
      year, setYear,
    },
    error,
    isLoading,
    refetch,
  };
};

export default useReport;
