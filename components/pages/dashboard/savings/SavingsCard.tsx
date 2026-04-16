import DeleteButton from '@/components/default/action/DeleteButton';
import { Button } from '@/components/ui/button';
import { TSavingsGoal } from '@/hooks/datasource/useSavingsGoal';
import { httpClient } from '@/lib/httpClient';
import { calculateMonthsRemaining, calculateProgress, dateFormat, formatIDR } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { NextPage } from 'next'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

interface Props {
  goal: TSavingsGoal,
  onUpdate?: () => void
}

// const generateProjection = (goal: TSavingsGoal) => {
//   const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
//   const projection = [];
//   let amount = goal.currentAmount;

//   projection.push({ month: "Current", amount: amount, target: goal.targetAmount });

//   for (let i = 1; i <= Math.min(monthsRemaining, 12); i++) {
//     amount += goal.monthlyContribution;
//     projection.push({
//       month: `Month ${i}`,
//       amount: Math.min(amount, goal.targetAmount),
//       target: goal.targetAmount,
//     });
//   }

//   return projection;
// };
const SavingsCard: NextPage<Props> = ({ goal, onUpdate }) => {
  const progress = calculateProgress(goal.current_amount, goal.target_amount);
  const monthsRemaining = calculateMonthsRemaining(goal.target_date);
  const remainingAmount = goal.target_amount - goal.current_amount;
  const deleteSavings = async () => {
    try {
      const { message, status } = await httpClient.delete(`/savings/goal/${goal.id}`)
      if (status == 200) {
        toast.success('Success delete goals')
        onUpdate?.()
        return
      }
      toast.error(message)
    } catch (error) {
      console.error(error)
      toast.error('Server Error')
    }
  }
  return <div key={goal.id} className="bg-white rounded-xl p-6 border border-gray-200">
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Goal Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
            <p className="text-sm text-gray-600 capitalize mt-1">{goal.category.name}</p>
          </div>
          <DeleteButton handler={deleteSavings}>
            <Button
              variant={'destructive'}
              size={'icon'}
            >
              <Trash2 size={18} className="" />
            </Button>
          </DeleteButton>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatIDR(goal.current_amount)} / {formatIDR(goal.target_amount)} ({progress.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Remaining</p>
              <p className="font-semibold text-gray-900">{formatIDR(remainingAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Target Date</p>
              <p className="font-semibold text-gray-900">{dateFormat(goal.target_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Monthly</p>
              <p className="font-semibold text-gray-900">{goal.monthly_target ? formatIDR(goal.monthly_target) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Months Left</p>
              <p className="font-semibold text-gray-900">{monthsRemaining} months</p>
            </div>
          </div>


        </div>
      </div>

      {/* Projection Chart */}
      <div className="lg:w-96">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={goal.graph.map(g => ({
            amount: g.amount,
            date: `${g.year}-${g.month}`
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis dataKey="amount" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
}

export default SavingsCard