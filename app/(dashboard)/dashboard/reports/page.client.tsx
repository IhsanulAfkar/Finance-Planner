'use client'
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";
import useReport, { Period } from "@/hooks/datasource/useReport";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatIDR } from "@/lib/utils";


// Mock data for different time ranges
const dailyData = [
  { time: "12 AM", expenses: 0, income: 0 },
  { time: "4 AM", expenses: 0, income: 0 },
  { time: "8 AM", expenses: 45, income: 0 },
  { time: "12 PM", expenses: 125, income: 0 },
  { time: "4 PM", expenses: 89, income: 0 },
  { time: "8 PM", expenses: 67, income: 0 },
];

const weeklyData = [
  { day: "Mon", expenses: 245, income: 0 },
  { day: "Tue", expenses: 189, income: 0 },
  { day: "Wed", expenses: 312, income: 0 },
  { day: "Thu", expenses: 276, income: 5000 },
  { day: "Fri", expenses: 425, income: 0 },
  { day: "Sat", expenses: 198, income: 0 },
  { day: "Sun", expenses: 156, income: 0 },
];

const monthlyData = [
  { week: "Week 1", expenses: 1245, income: 0 },
  { week: "Week 2", expenses: 1567, income: 5000 },
  { week: "Week 3", expenses: 1389, income: 0 },
  { week: "Week 4", expenses: 1678, income: 0 },
];

const yearlyData = [
  { month: "Jan", expenses: 3450, income: 5000 },
  { month: "Feb", expenses: 3200, income: 5000 },
  { month: "Mar", expenses: 3800, income: 5000 },
  { month: "Apr", expenses: 4100, income: 5000 },
  { month: "May", expenses: 3900, income: 5500 },
  { month: "Jun", expenses: 4200, income: 5500 },
  { month: "Jul", expenses: 3700, income: 5500 },
  { month: "Aug", expenses: 4400, income: 5500 },
  { month: "Sep", expenses: 3950, income: 5500 },
  { month: "Oct", expenses: 4150, income: 6000 },
  { month: "Nov", expenses: 4300, income: 6000 },
  { month: "Dec", expenses: 4600, income: 6000 },
];

const categoryBreakdown = {
  day: [
    { category: "Food & Dining", amount: 125, percentage: 38.5 },
    { category: "Transportation", amount: 55, percentage: 16.9 },
    { category: "Shopping", amount: 89, percentage: 27.4 },
    { category: "Bills", amount: 56, percentage: 17.2 },
  ],
  week: [
    { category: "Food & Dining", amount: 850, percentage: 47.2 },
    { category: "Transportation", amount: 220, percentage: 12.2 },
    { category: "Shopping", amount: 420, percentage: 23.3 },
    { category: "Entertainment", amount: 180, percentage: 10.0 },
    { category: "Bills", amount: 131, percentage: 7.3 },
  ],
  month: [
    { category: "Food & Dining", amount: 1850, percentage: 31.2 },
    { category: "Transportation", amount: 620, percentage: 10.4 },
    { category: "Shopping", amount: 1280, percentage: 21.6 },
    { category: "Entertainment", amount: 580, percentage: 9.8 },
    { category: "Bills", amount: 1550, percentage: 26.1 },
  ],
  year: [
    { category: "Food & Dining", amount: 15400, percentage: 31.7 },
    { category: "Transportation", amount: 6200, percentage: 12.8 },
    { category: "Shopping", amount: 10800, percentage: 22.2 },
    { category: "Entertainment", amount: 4800, percentage: 9.9 },
    { category: "Bills", amount: 11200, percentage: 23.1 },
  ],
};

export default function PageClient() {
  const { data, isLoading, refetch, filter } = useReport()
  const periods: Period[] = ["day", "week", "month", "year"]

  const totalExpenses = data?.totalExpense ?? 0
  const totalIncome = data?.totalIncome ?? 0
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = data?.overallSavingsRate ?? 0

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your spending patterns over time</p>
        </div>

        {/* Time Range Selector */}

        <Tabs
          value={filter.period}
          onValueChange={(val) => filter.setPeriod(val as Period)}
          className="w-fit"
        >
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            {periods.map((range) => (
              <TabsTrigger
                key={range}
                value={range}
                className="capitalize px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {range}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Savings Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(savingsRate * 100).toFixed(2)}%</p>
        </div>
      </div>

      {/* Spending Trend Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {filter.period === "day" && "Today's Activity"}
          {filter.period === "week" && "This Week's Activity"}
          {filter.period === "month" && "This Month's Activity"}
          {filter.period === "year" && "This Year's Activity"}
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data?.graph ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={'period'} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            {data?.graphMeta.goal.map(g => <Line
              key={g.key}
              dataKey={g.key}
              // stroke={colors[idx % colors.length]}
              name={`[Savings] ${g.title}`}
            />)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown[filter.period].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.category}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${item.amount.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBreakdown[filter.period]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">💡 Insights</h2>
        <div className="space-y-2 text-gray-700">
          <p>• Your {filter.period}ly savings rate is {savingsRate}%</p>
          <p>• Top spending category: {categoryBreakdown[filter.period][0].category} (${categoryBreakdown[filter.period][0].amount.toLocaleString()})</p>
          {netSavings > 0 ? (
            <p>• You saved ${netSavings.toLocaleString()} this {filter.period}! Keep it up! 🎉</p>
          ) : (
            <p>• Consider reducing expenses to build your savings</p>
          )}
        </div>
      </div>
    </div>
  );
}
