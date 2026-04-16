'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
export type TSavingsCategory = {
  id: number;
  name: string;
  user_id: number;
  created_at: Date;
}
const useSavingsCategory = () => {
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['savings-category'],
    queryFn: async () => {
      return httpClient.get<TSavingsCategory[]>(
        buildUrl('/savings/categories'),
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

export default useSavingsCategory;
