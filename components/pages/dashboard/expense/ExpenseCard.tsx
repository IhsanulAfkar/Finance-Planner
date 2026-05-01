import { Button } from '@/components/ui/button'
import { TTransaction } from '@/hooks/datasource/useTransaction'
import { dateFormat, formatIDR } from '@/lib/utils'
import { Edit2, Trash2 } from 'lucide-react'
import { NextPage } from 'next'
import { toast } from 'sonner'
import { httpClient } from '@/lib/httpClient'
import DeleteButton from '@/components/default/action/DeleteButton'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ImageWrapper from '@/components/ui/custom/image-wrapper'

interface Props {
  data: TTransaction,
  onDelete?: () => void
}

const ExpenseCard: NextPage<Props> = ({ data, onDelete }) => {
  const [openDetailModal, setOpenDetailModal] = useState(false)
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
  const receiptItems = data.receipts.flatMap(i => i.items)
  return <div
    className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-lg bg-card-2 hover:bg-card-2-active"
  >
    <div className="flex-1">
      <div className="flex items-start justify-between mb-2">
        <div className='hover:underline hover:cursor-pointer' onClick={() => setOpenDetailModal(true)}>
          <p className="font-semibold flex items-center gap-2 text-xl">
            {data.source}
          </p>
          <p className="text-sm text-muted-foreground">{dateFormat(data.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-lg font-bold ">
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
      <div className='flex gap-4'>

        {receiptItems.length > 0 && (
          <div className="mt-3 rounded-xl border bg-muted/30 p-3  w-full max-w-lg">
            <p className="text-sm font-medium text-foreground mb-2">
              Items
            </p>

            <ul className="space-y-1.5">
              {receiptItems.map(item => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-secondary-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatIDR(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.receipts.filter(rec => rec.image_url).length > 0 && (

          <div>
            <p className='text-sm font-semibold'>Receipts</p>
            <div className='flex gap-4 overflow-x-auto h-32 mt-1'>
              {data.receipts.filter(rec => rec.image_url).map(rec => <ImageWrapper key={rec.id} src={'/api' + rec.image_url} alt={rec.merchant} className='h-full rounded-md' />)}
            </div>
          </div>
        )}
      </div>
    </div>
    {openDetailModal && <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
      <DialogContent className='w-full max-w-2xl!'>
        <DialogHeader>
          <DialogTitle>Detail Transaction: {data.description}</DialogTitle>
        </DialogHeader>
        <div className='flex gap-4'>
          {data.receipts.length > 0 && <div>
            {data.receipts.filter(rec => rec.image_url && rec.image_url.trim() != '').map(rec => <ImageWrapper key={rec.id} alt='receipt' src={'/api' + rec.image_url} />)}
          </div>}
        </div>
      </DialogContent></Dialog>}
  </div>
}

export default ExpenseCard