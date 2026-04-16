'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
export type TTransactionCategory = {
  color: string | null;
  id: number;
  name: string;
  type: string;
  icon: string | null;
  user_id: number;
  created_at: Date;
}
const useTransactionCategory = () => {
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transaction-category'],
    queryFn: async () => {
      return httpClient.get<TTransactionCategory[]>(
        buildUrl('/transactions/categories'),
      );
    },
  });
  if (error) {
    console.log(error);
    toast.error('Server Error');
  }
  return {
    data: response?.data ?? [],
    expense: response?.data?.filter(c => c.type === 'EXPENSE') ?? [],
    income: response?.data?.filter(c => c.type === 'INCOME') ?? [],
    status: response?.status,
    error,
    isLoading,
    refetch,
  };
};

export default useTransactionCategory;
