'use client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { AlertTriangle, Calendar, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import useReport, { Period } from "@/hooks/datasource/useReport";
import useReportInsight, { TReportInsight } from "@/hooks/datasource/useReportInsight";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/utils";
import { getReportRange, resolveBaseDate } from "@/lib/reportRange";

const periodTitles: Record<Period, string> = {
  day: "Daily Activity",
  week: "Weekly Activity",
  month: "Monthly Activity",
  year: "Yearly Activity",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
];

const insightStyles: Record<
  string,
  { icon: typeof TrendingUp; color: string }
> = {
  positive: { icon: TrendingUp, color: "bg-green-50 text-green-600" },
  warning: { icon: AlertTriangle, color: "bg-red-50 text-red-500" },
  neutral: { icon: Lightbulb, color: "bg-yellow-50 text-yellow-600" },
};

const compactNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
};

const categoryColor = (color: string | null, idx: number) =>
  color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
    ? color
    : CHART_COLORS[idx % CHART_COLORS.length];

function InsightItem({ insight }: { insight: TReportInsight }) {
  const style = insightStyles[insight.type] ?? insightStyles.neutral;
  const Icon = style.icon;

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-white/70">
      <div className={`p-2 rounded-full shrink-0 ${style.color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold leading-relaxed">{insight.title}</p>
        <p className="text-xs leading-relaxed">{insight.description}</p>
      </div>
    </div>
  );
}

export default function PageClient() {
  const { data, isLoading, filter } = useReport();
  const {
    data: insights = [],
    isLoading: isInsightsLoading,
  } = useReportInsight(filter);

  const periods: Period[] = ["day", "week", "month", "year"];
  const years = Array.from(
    new Set([
      ...Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + 1 - i),
      filter.year,
    ]),
  ).sort((a, b) => b - a);

  const anchor = resolveBaseDate(filter);
  const reportRange = getReportRange(filter);
  const weekEnd = new Date(reportRange.start);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const rangeLabel =
    filter.period === "day"
      ? dateFormatter.format(anchor)
      : filter.period === "week"
        ? `${dateFormatter.format(reportRange.start)} – ${dateFormatter.format(weekEnd)}`
        : filter.period === "month"
          ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : String(anchor.getFullYear());

  const totalExpenses = data?.totalExpense ?? 0;
  const totalIncome = data?.totalIncome ?? 0;
  const savingsRate = data?.overallSavingsRate ?? 0;
  const categories = data?.categories ?? [];

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your spending patterns over time</p>
        </div>

        {/* Period & date selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={filter.period}
            onValueChange={(val) => filter.setPeriod(val as Period)}
            className="w-fit"
          >
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              {periods.map((period) => (
                <TabsTrigger
                  key={period}
                  value={period}
                  className="capitalize px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {period}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {(filter.period === "day" || filter.period === "week") && (
            <div className="flex items-center gap-2">
              {filter.period === "week" && (
                <span className="text-xs text-gray-500">7 days ending</span>
              )}
              <input
                type="date"
                aria-label="Select date"
                value={filter.date}
                onChange={(e) => filter.setDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {filter.period === "month" && (
            <input
              type="month"
              aria-label="Select month"
              value={filter.month}
              onChange={(e) => filter.setMonth(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {filter.period === "year" && (
            <select
              aria-label="Select year"
              value={filter.year}
              onChange={(e) => filter.setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
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
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formatIDR(totalExpenses)}</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Income</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formatIDR(totalIncome)}</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Savings Rate</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {(savingsRate * 100).toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Spending Trend Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {periodTitles[filter.period]} · {rangeLabel}
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data?.graph ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={compactNumber} />
            <Tooltip
              formatter={(value) => formatIDR(Number(value))}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            {data?.graphMeta.goal.map((g) => (
              <Line
                key={g.key}
                type="monotone"
                dataKey={g.key}
                name={`[Savings] ${g.title}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">
              No expenses recorded for this {filter.period}.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((item, idx) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatIDR(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: categoryColor(item.color, idx),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Comparison</h2>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : categories.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
              No expenses recorded for this {filter.period}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={compactNumber} />
                <Tooltip
                  formatter={(value) => formatIDR(Number(value))}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="amount" name="Expenses" radius={[4, 4, 0, 0]}>
                  {categories.map((item, idx) => (
                    <Cell
                      key={item.id}
                      fill={categoryColor(item.color, idx)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">💡 Insights</h2>
        <p className="text-xs text-gray-500 mb-3">
          Based on {rangeLabel} income, expenses and categories, compared with
          the previous {filter.period}.
        </p>
        {isInsightsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm text-gray-600">No insights available yet.</p>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <InsightItem key={`${insight.title}-${idx}`} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
