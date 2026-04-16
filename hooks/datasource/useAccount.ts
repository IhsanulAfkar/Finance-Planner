'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
export type TAccount = {
  type: string;
  balance: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  id: number;
  user_id: number;
}
const useAccount = () => {
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      return httpClient.get<TAccount[]>(
        buildUrl('/account'),
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

export default useAccount;
