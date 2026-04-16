import { FrequencyType } from '@/generated/prisma/enums'
import { cn } from '@/lib/utils'
import { NextPage } from 'next'

interface Props {
  frequency: string
}
export const frequencyMapped: Record<string, string> = {
  MONTHLY: "Monthly",
  ONE_TIME: "One Time",
  WEEKLY: "Weekly",
  YEARLY: "Yearly",
}
const FrequencyBadge: NextPage<Props> = ({ frequency }) => {
  return <div className={cn("px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700")}>{frequencyMapped[frequency]}</div>
}

export default FrequencyBadge