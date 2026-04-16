'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticle, TArticleCategory, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
import { TTask } from './useTasks';

export type TChatExecutionItem = {
  id: number;
  execution_id: number;
  transaction_id?: number | null;
  savings_contribution_id?: number | null;
  account_id?: number | null;

  transaction?: any;
  savingsContribution?: any;
  account?: any;
};

export type TChatExecution = {
  id: number;
  method: string;
  payload: any;
  created_at: string;
  chat_id: number;
  chatExecutionHistoryItems: TChatExecutionItem[];
};

export type TChat = {
  id: number;
  user_id: number;
  role: 'assistant' | 'user';
  content: string;
  created_at: string;
  chatExecutionHistories: TChatExecution[];
};

const useChatHistory = () => {
  const { order, sort } = useSort();

  useSyncUrl({
    sortOrder: order.sortOrder,
    sortBy: sort.sortBy,
  });

  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['chat-history', order.sortOrder, sort.sortBy],
    queryFn: async () => {
      return httpClient.get<TChat[]>(
        buildUrl('/chat', {
          orderBy: sort.sortBy,
          order: order.sortOrder,
        })
      );
    },
  });

  if (error) {
    console.error(error);
    toast.error('Server Error');
  }

  return {
    data: response?.data ?? [],
    status: response?.status,
    filter: {
      sort,
      order,
    },
    error,
    isLoading,
    refetch,
  };
};

export default useChatHistory;