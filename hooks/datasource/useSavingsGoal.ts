'use client';
import { httpClient } from '@/lib/httpClient';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { buildUrl } from '@/lib/utils';
import { TSavingsCategory } from './useSavingsCategory';
export type TSavingsGoal = {
  id: number,
  user_id: number,
  title: string,
  category_id: number,
  target_amount: number,
  current_amount: number,
  monthly_target: number | null,
  target_date: string,
  created_at: string,
  category: TSavingsCategory,
  contributions: TSavingsContribution[]
  graph: {
    year: string,
    month: string,
    amount: number
  }[]
}
export type TSavingsContribution = {
  id: number,
  goal_id: number,
  transaction_id: number,
  amount: number,
  date: string
}
const useSavingsGoal = () => {
  const {
    data: response,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['savings-goal'],
    queryFn: async () => {
      return httpClient.get<TSavingsGoal[]>(
        buildUrl('/savings/goal'),
      );
    },
  });
  if (error) {
    console.log(error);
    toast.error('Server Error');
  }
  const goals = response?.data ?? []
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalMonthlyContribution = goals.reduce((sum, g) => sum + (g.monthly_target ?? 0), 0);
  return {
    data: response?.data ?? [],
    status: response?.status,
    extras: {
      total_amount: totalTargetAmount,
      total_current_amount: totalCurrentAmount,
      total_monthly_contribution: totalMonthlyContribution
    },
    error,
    isLoading,
    refetch,
  };
};

export default useSavingsGoal;
