'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
export type TTransactionChart = {
  "year": string,
  "month": string,
  "income": number,
  "expense": number
}
const useTransactionChartMonthly = () => {
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transaction-chart'],
    queryFn: async () => {
      return httpClient.get<TTransactionChart[]>(
        buildUrl('/transactions/chart/monthly'),
      );
    },
  });
  if (error) {
    console.log(error);
    toast.error('Server Error');
  }
  return {
    data: response?.data ?? [],
    status: response?.status,
    error,
    isLoading,
    refetch,
  };
};

export default useTransactionChartMonthly;
