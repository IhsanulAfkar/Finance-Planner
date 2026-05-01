"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUp, ArrowDown, Plus } from "lucide-react"
import { useState } from "react"
import CreateIncomeModal from "./income/CreateIncomeModal"
import { useRouter } from "@bprogress/next/app"
import useDashboard from "@/hooks/datasource/useDashboard"
import { formatIDR } from "@/lib/utils"
import SavingsGoalSection from "./dashboard/SavingsGoalSection"
import { StatCardSkeleton } from "@/components/ui/custom/skeleton"
import InsightSection from "./dashboard/InsightSection"
import useTransaction from "@/hooks/datasource/useTransaction"
import TransactionSection from "./dashboard/TransactionSection"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const { data: dataDashboard, isLoading: isLoadingDashboard } = useDashboard()
  const [openIncome, setOpenIncome] = useState(false)
  return (
    <div className="w-full mx-auto space-y-6">
      {/* Top Stats */}
      <div className="flex justify-between md:flex-row flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold ">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href={'/dashboard/expenses'}><Button variant="secondary"><Plus className="mr-2" size={16} /> Add Expense</Button></Link>
          <Button onClick={() => setOpenIncome(true)} variant="secondary"><Plus className="mr-2" size={16} /> Add Income</Button>
          {openIncome && <CreateIncomeModal open={openIncome} setOpen={setOpenIncome} onSuccess={() => {
            router.push('/dashboard/income')
            setOpenIncome(false)
          }} />}
        </div>
      </div>
      {isLoadingDashboard ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Income" current={dataDashboard?.totalIncome.current} last={dataDashboard?.totalIncome.last} />
          <StatCard title="Total Expense" current={dataDashboard?.totalExpense.current} last={dataDashboard?.totalExpense.last} />
          <StatCard title="Net Cashflow" current={dataDashboard?.netCashflow.current} last={dataDashboard?.netCashflow.last} />
          <StatCard title="Savings Rate" current={dataDashboard?.savingsRate.current} last={dataDashboard?.savingsRate.last} type="percentage" />
        </div>}

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">

          <InsightSection />
        </div>
        <SavingsGoalSection />
      </div>
      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransactionSection />
        <Alerts />
      </div>
    </div>
  )
}

function StatCard({
  title,
  current,
  last,
  type = 'idr'
}: {
  title: string;
  current: number | null | undefined;
  last: number | null | undefined;
  type?: 'idr' | 'percentage'
}) {
  const safeCurrent = current ?? 0;
  const safeLast = last ?? 0;

  // =========================
  // Calculate trend
  // =========================
  let trend: "up" | "down" | "flat" = "flat";

  if (safeCurrent > safeLast) trend = "up";
  else if (safeCurrent < safeLast) trend = "down";

  // =========================
  // Calculate percentage
  // =========================
  let percent = 0;

  if (safeLast > 0) {
    percent = ((safeCurrent - safeLast) / safeLast) * 100;
  } else if (safeCurrent > 0) {
    percent = 100; // from 0 → something
  }

  const isUp = trend === "up";
  const printValue = (val: number) => {
    if (type === 'idr') return formatIDR(val)
    return `${val.toFixed(1)}%`
  }
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold">{printValue(safeCurrent)}</h2>
          <p className="text-xs text-muted-foreground">
            Last: {printValue(safeLast)}
          </p>
        </div>

        <div
          className={`flex items-center gap-1 text-sm ${trend === "flat"
            ? "text-gray-400"
            : isUp
              ? "text-green-600"
              : "text-red-500"
            }`}
        >
          {trend === "flat" ? null : isUp ? (
            <ArrowUp size={16} />
          ) : (
            <ArrowDown size={16} />
          )}

          {percent.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}


function Alerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>⚠️ Alerts</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p className="text-red-500">You exceeded Food budget</p>
        <p className="text-yellow-600">Emergency fund is low</p>
      </CardContent>
    </Card>
  )
}
