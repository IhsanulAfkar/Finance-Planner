'use client';
import { httpClient } from '@/lib/httpClient';
import { TArticleCategory, TPaginatedResponse, TResponseMeta } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSort } from '../useSort';
import { useSyncUrl } from '../useSyncUrl';
import { buildUrl } from '@/lib/utils';
import { useState } from 'react';
import { TransactionType } from '@/generated/prisma/enums';
import { TAccount } from './useAccount';
import { useQueryVariable } from '../useQueryVariable';
export type TTransaction = {
  id: number,
  user_id: number,
  account_id: number,
  source: string | null,
  category_id: number | null,
  amount: number,
  type: string,
  description: string,
  date: string,
  frequency: string,
  created_at: string,
  category: TCategory | null,
  account: TAccount,
  receipts: TReceipt[]
}
export type TReceiptItem = {
  id: number,
  receipt_id: number,
  name: string,
  price: number
}
export type TCategory = {
  id: number,
  user_id: number,
  name: string,
  color: string,
  icon: string,
  type: string,
  created_at: string
}
export type TReceipt = {
  id: number,
  user_id: number,
  merchant: string,
  total: number,
  date: string,
  image_url: string | null,
  is_verified: boolean,
  transaction_id: number,
  created_at: string
  items: TReceiptItem[]
}
const useTransaction = ({ type: initialType }: {
  type?: TransactionType
} = {}) => {
  const queryVariable = useQueryVariable(["page", "limit"])
  const [page, setPage] = useState(Number(queryVariable.pageQuery) || 1)
  const [limit, setLimit] = useState(Number(queryVariable.limitQuery) || 10)
  const [type, setType] = useState(initialType)
  const filter = {
    page, limit, type
  }
  useSyncUrl(filter)
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transaction', filter],
    queryFn: async () => {
      return httpClient.get<TPaginatedResponse<TTransaction>>(
        buildUrl('/transactions', filter),
      );
    },
  });
  if (error) {
    console.log(error);
    toast.error('Server Error');
  }
  console.log(response)
  return {
    data: response?.data.data ?? [],
    meta: response?.data.meta,
    status: response?.status,
    filter: {
      ...filter,
      setPage, setLimit, setType
    },
    error,
    isLoading,
    refetch,
  };
};

export default useTransaction;