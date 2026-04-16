'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
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
  }
}
export type Period = "day" | "week" | "month" | "year"
const useReport = () => {
  const [period, setPeriod] = useState<Period>('month')
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['report', period],
    queryFn: async () => {
      return httpClient.get<TReport>(
        buildUrl('/report', { period }),
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
      period, setPeriod
    },
    error,
    isLoading,
    refetch,
  };
};

export default useReport;
