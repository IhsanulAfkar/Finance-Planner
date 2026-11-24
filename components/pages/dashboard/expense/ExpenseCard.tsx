import { Button } from '@/components/ui/button'
import { TTransaction } from '@/hooks/datasource/useTransaction'
import { dateFormat, formatIDR } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { NextPage } from 'next'
import { toast } from 'sonner'
import { httpClient } from '@/lib/httpClient'
import DeleteButton from '@/components/default/action/DeleteButton'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ImageWrapper from '@/components/ui/custom/image-wrapper'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Props {
  data: TTransaction,
  onDelete?: () => void
}

const DetailField = ({ label, value, className = '' }: { label: string, value: React.ReactNode, className?: string }) => (
  <div className={className}>
    <Label className="text-muted-foreground text-xs">{label}</Label>
    <div className="text-sm font-medium mt-0.5 break-words">{value || '-'}</div>
  </div>
)

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
      <DialogContent className='w-full max-w-3xl! max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Detail Transaction</DialogTitle>
        </DialogHeader>

        {/* Transaction summary */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border bg-muted/30 p-4'>
          <DetailField
            label="Source"
            value={data.source}
            className='col-span-2 md:col-span-1'
          />
          <DetailField label="Date" value={dateFormat(data.date)} />
          <DetailField
            label="Amount"
            value={<span className='text-base font-bold'>{formatIDR(data.amount)}</span>}
          />
          <DetailField label="Category" value={data.category?.name} />
          <DetailField label="Account" value={data.account?.type} />
          <DetailField
            label="Type"
            value={
              <Badge variant={data.type === 'EXPENSE' ? 'destructive' : 'default'}>
                {data.type || '-'}
              </Badge>
            }
          />
          <DetailField label="Frequency" value={data.frequency} />
          <DetailField label="Created At" value={dateFormat(data.created_at)} />
        </div>

        <div className='space-y-1'>
          <Label className='text-muted-foreground text-xs'>Description</Label>
          <p className='text-sm break-words'>{data.description || '-'}</p>
        </div>

        {/* Receipts */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold'>Receipts</h3>
            <Badge variant='secondary'>{data.receipts.length}</Badge>
          </div>

          {data.receipts.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-8 rounded-xl border border-dashed'>
              No receipts for this transaction.
            </p>
          ) : (
            <div className='space-y-4'>
              {data.receipts.map(rec => (
                <div key={rec.id} className='rounded-xl border bg-muted/30 p-4 space-y-3'>
                  <div className='flex flex-wrap items-start justify-between gap-2'>
                    <div>
                      <p className='font-semibold'>{rec.merchant || '-'}</p>
                      <p className='text-xs text-muted-foreground'>{dateFormat(rec.date)}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>{formatIDR(rec.total)}</span>
                      <Badge variant={rec.is_verified ? 'default' : 'outline'}>
                        {rec.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>

                  {rec.items.length > 0 && (
                    <div>
                      <p className='text-xs font-medium text-muted-foreground mb-1.5'>Items</p>
                      <ul className='space-y-1'>
                        {rec.items.map(item => (
                          <li key={item.id} className='flex items-center justify-between text-sm'>
                            <span>{item.name}</span>
                            <span className='font-medium'>{formatIDR(item.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.image_url?.trim() && (
                    <ImageWrapper
                      src={'/api' + rec.image_url}
                      alt={rec.merchant || 'receipt'}
                      className='max-h-72 w-auto rounded-md'
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent></Dialog>}
  </div>
}

export default ExpenseCard
