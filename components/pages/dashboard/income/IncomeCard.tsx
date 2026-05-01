import { Button } from '@/components/ui/button'
import { TTransaction } from '@/hooks/datasource/useTransaction'
import { dateFormat, formatIDR } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'
import { NextPage } from 'next'
import FrequencyBadge from './FrequencyBadge'
import { toast } from 'sonner'
import { httpClient } from '@/lib/httpClient'
import DeleteButton from '@/components/default/action/DeleteButton'

interface Props {
  income: TTransaction,
  onDelete?: () => void
}

const IncomeCard: NextPage<Props> = ({ income, onDelete }) => {
  const handleDelete = async () => {
    // return
    try {
      const { message, status } = await httpClient.delete(`/transactions/${income.id}`)
      if (status === 200) {
        toast.success('Success Delete Income')
        onDelete?.()
        return
      }
      toast.error(message)
    } catch (error) {
      console.error(error)
      toast.error('Something Wrong')
    }
  }
  return <div
    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-card-2"
  >
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-1">
        <h3 className="font-semibold text-gray-900">{income.source}</h3>
        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
          {income.category?.name}
        </span>
        <FrequencyBadge frequency={income.frequency} />
      </div>
      <p className="text-sm text-gray-600">{dateFormat(income.date)}</p>
      {income.description && (
        <p className="text-sm text-gray-500 mt-1">{income.description}</p>
      )}
    </div>

    <div className="flex items-center gap-4">
      <p className=" font-bold ">
        {formatIDR(income.amount)}
      </p>
      <div className="flex gap-2">
        <Button
          size={'icon'}
          variant={'outline'}
        >
          <Edit2 size={18} className="text-gray-600" />
        </Button>
        <DeleteButton handler={handleDelete}>
          <Button
            size={'icon'}
            variant={'destructive'}
          >
            <Trash2 size={18} />
          </Button>
        </DeleteButton>
      </div>
    </div>
  </div>
}

export default IncomeCard