'use client'
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingUp, Calendar, DollarSign, Briefcase, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import useTransaction from "@/hooks/datasource/useTransaction";
import { Path, useFieldArray, useForm } from "react-hook-form";
import { IncomeFormData, incomeSchema } from "@/lib/validation/income";
import { zodResolver } from '@hookform/resolvers/zod';
import InputForm from "@/components/form/InputForm";
import { SelectForm } from "@/components/form/SelectForm";
import { DateTimeField } from "@/components/form/DateTimeField";
import { Button } from "@/components/ui/button";
import { TextAreaForm } from "@/components/form/TextAreaForm";
import useSavingsGoal from "@/hooks/datasource/useSavingsGoal";
import { httpClient } from "@/lib/httpClient";
import { toastValidation } from "@/lib/action/clientHelper";
import useAccount from "@/hooks/datasource/useAccount";
import LoadingIndicator from "@/components/default/LoadingIndicator";
import IncomeCard from "@/components/pages/dashboard/income/IncomeCard";
import { formatIDR, isSameMonth, isToday } from "@/lib/utils";
import useTransactionChartMonthly from "@/hooks/datasource/useTransactionChartMonthly";
import { ChartSkeleton, EmptyState } from "@/components/ui/custom/skeleton";
import CurrencyForm from "@/components/form/CurrencyForm";
import { CATEGORIES } from "@/lib/constant";
import CreateIncomeModal from "@/components/pages/dashboard/income/CreateIncomeModal";
interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  category: string;
  date: string;
  frequency: "one-time" | "weekly" | "monthly" | "yearly";
  description?: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: string;
}

export default function PageClient() {

  const { data: incomes, isLoading: isLoadingIncome, filter: filterIncome, refetch: refetchTransaction } = useTransaction({ type: 'INCOME' })
  const [showAddModal, setShowAddModal] = useState(false);

  // hooks
  const { data: chartMonthly, isLoading: isLoadingChartMonthly } = useTransactionChartMonthly()

  // Calculate statistics
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const thisMonthIncome = incomes
    .filter(i => isSameMonth(i.date))
    .reduce((sum, income) => sum + income.amount, 0);
  const recurringMonthlyIncome = incomes
    .filter((income) => income.frequency === "monthly")
    .reduce((sum, income) => sum + income.amount, 0);
  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all your income sources</p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(totalIncome)}</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(thisMonthIncome)}</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Monthly Recurring</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(recurringMonthlyIncome)}</p>
        </div>
      </div>

      {/* Add/Edit Income Form */}
      {showAddModal && (
        <CreateIncomeModal open={showAddModal} setOpen={setShowAddModal} onSuccess={() => refetchTransaction()} />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Income Trend */}
        <div className="bg-card rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income Trend</h2>

          {isLoadingChartMonthly ? (
            <ChartSkeleton />
          ) : chartMonthly.length === 0 ? (
            <EmptyState message="No income data available" />
          ) :
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartMonthly.map(m => ({
                month: `${m.month}-${m.year}`,
                income: m.income
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
        {/* Income by Category */}
        {/* <div className="bg-card rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h2>
          <div className="space-y-4">
            {incomeByCategory.map((item, idx) => {
              const percentage = (item.amount / totalIncome) * 100;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${item.amount.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}
      </div>

      {/* Income List */}
      <div className="bg-card rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Income History</h2>
        {isLoadingIncome ? <LoadingIndicator /> :
          <div className="space-y-3">
            {incomes.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No income entries yet</h3>
                <p className="text-gray-600 mb-6">Start tracking your income by adding your first entry</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={20} />
                  Add Your First Income
                </Button>
              </div>
            ) : (
              incomes.map((income) => (
                <IncomeCard income={income} key={income.id} onDelete={refetchTransaction} />
              ))
            )}
          </div>
        }
      </div>
    </div>
  );
}