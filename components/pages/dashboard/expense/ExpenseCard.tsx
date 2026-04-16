import { Button } from '@/components/ui/button'
import { TTransaction } from '@/hooks/datasource/useTransaction'
import { dateFormat, formatIDR } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'
import { NextPage } from 'next'
import { toast } from 'sonner'
import { httpClient } from '@/lib/httpClient'
import DeleteButton from '@/components/default/action/DeleteButton'

interface Props {
  data: TTransaction,
  onDelete?: () => void
}

const ExpenseCard: NextPage<Props> = ({ data, onDelete }) => {
  const handleDelete = async () => {
    // return
    try {
      const { message, status } = await httpClient.delete(`/transactions/${data.id}`)
      if (status === 200) {
        toast.success('Success Delete Expense')
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
    className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
  >
    {/* {receipt.imageUrl && (
                <img
                  src={receipt.imageUrl}
                  alt="Receipt"
                  className="w-full md:w-24 h-24 object-cover rounded-lg"
                />
              )} */}

    <div className="flex-1">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900 flex items-center gap-2 text-xl">
            {data.source}
          </p>
          <p className="text-sm text-gray-600">{dateFormat(data.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-gray-900">
            {formatIDR(data.amount)}
          </p>
          <DeleteButton handler={handleDelete}>

            <Button
              variant={'destructive'}
              size={'icon'}
            >
              <Trash2 />
            </Button>
          </DeleteButton>
        </div>
      </div>

      {data.category && (
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full mb-2">
          {data.category.name}
        </span>
      )}

      {data.receipts.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Items:</p>
          <ul className="text-sm text-gray-700 mt-1">
            {data.receipts.flatMap((item) => item.items).map(item => <li key={item.id}>{item.name} ({formatIDR(item.price)})</li>)}
          </ul>
        </div>
      )}
    </div>
  </div>
}

export default ExpenseCard