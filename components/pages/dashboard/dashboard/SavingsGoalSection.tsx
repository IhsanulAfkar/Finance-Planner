import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import useSavingsGoal from '@/hooks/datasource/useSavingsGoal'
import { calculateProgress } from '@/lib/utils'
import { NextPage } from 'next'

function GoalItem({ name, progress }: { name: string, progress: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className='font-semibold'>{name}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )
}
const SavingsGoalSection = () => {
  const { data, isLoading } = useSavingsGoal()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-60 overflow-y-auto">
        {isLoading ? <>
          {[1, 2, 3, 4].map(i => <div key={i}>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>)}
        </> : <>
          {data.map(d => {
            const progress = calculateProgress(d.current_amount, d.target_amount);
            return <GoalItem key={d.id} name={d.title} progress={progress} />
          }
          )}
        </>}
      </CardContent>
    </Card>
  )
}

export default SavingsGoalSection