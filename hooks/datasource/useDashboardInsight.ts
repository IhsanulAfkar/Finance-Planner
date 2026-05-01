'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticle, TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
import { TTask } from './useTasks';
export type TDashboardInsight = {
  title: string,
  description: string,
  type: string
}
const useDashboardInsight = () => {

  const {
    data: response,
    error,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['dashboard-insight'],
    queryFn: async () => {
      return httpClient.get<{
        data: TDashboardInsight[],
        meta: {
          income: {
            current: number,
            last: number,
            growth: number
          },
          expense: {
            current: number,
            last: number,
            growth: number
          },
          savingsRate: {
            current: number,
            last: number,
            diff: number
          },
          topCategories: {
            name: string,
            amount: number
          }[]
        }
      }>(
        buildUrl('/insight'),
      );
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
    isLoading: isLoading || isRefetching,
    refetch,
  };
};

export default useDashboardInsight;
