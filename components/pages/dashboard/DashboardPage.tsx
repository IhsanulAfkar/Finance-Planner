"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUp, ArrowDown, Plus } from "lucide-react"
import { useState } from "react"
import CreateIncomeModal from "./income/CreateIncomeModal"
import { useRouter } from "@bprogress/next/app"

export default function Dashboard() {
  return (
    <div className="w-full mx-auto space-y-6">
      {/* Top Stats */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your financial overview.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value="$5,000" trend="up" percent="12%" />
        <StatCard title="Total Expense" value="$3,200" trend="down" percent="8%" />
        <StatCard title="Net Cashflow" value="$1,800" trend="up" percent="5%" />
        <StatCard title="Savings Rate" value="36%" trend="up" percent="3%" />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsCard />
        <GoalsCard />
      </div>

      {/* Actions + Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuickActions />
        <MiniTrends />
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions />
        <Alerts />
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, percent }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {percent}
        </div>
      </CardContent>
    </Card>
  )
}

function InsightsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>💡 Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>You spent 20% more than last week</p>
        <p>You are 65% towards your savings goal</p>
        <p>You can save $500 more this month</p>
      </CardContent>
    </Card>
  )
}

function GoalsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Savings Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalItem name="Buy Laptop" progress={65} />
        <GoalItem name="Vacation" progress={30} />
      </CardContent>
    </Card>
  )
}

function GoalItem({ name, progress }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}

function QuickActions() {
  const router = useRouter()
  const [openIncome, setOpenIncome] = useState(false)
  return (<>

    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="secondary"><Plus className="mr-2" size={16} /> Add Expense</Button>
        <Button onClick={() => setOpenIncome(true)} variant="secondary"><Plus className="mr-2" size={16} /> Add Income</Button>
      </CardContent>
    </Card>
    {openIncome && <CreateIncomeModal open={openIncome} setOpen={setOpenIncome} onSuccess={() => {
      router.push('/dashboard/income')
      setOpenIncome(false)
    }} />}
  </>
  )
}

function MiniTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📉 Trends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-green-600">Income ↑ 8%</p>
        <p className="text-red-500">Expenses ↑ 12%</p>
        <p className="text-green-600">Savings Rate ↑ 5%</p>
      </CardContent>
    </Card>
  )
}

function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <p>Grocery Store - $120</p>
        <p>Salary + $5000</p>
      </CardContent>
    </Card>
  )
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
