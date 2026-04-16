"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NextPage } from 'next'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { DatePickerTime } from '@/components/ui/date-picker-time'
import { useFieldArray, useForm } from 'react-hook-form'
import { ExpenseFormData, expenseFormSchema } from '@/lib/validation/expense'
import { zodResolver } from '@hookform/resolvers/zod'
import InputForm from '@/components/form/InputForm'
import { DateTimeField } from '@/components/form/DateTimeField'
import CurrencyForm from '@/components/form/CurrencyForm'
import { Trash2 } from 'lucide-react'
import useAccount from '@/hooks/datasource/useAccount'
import { SelectForm } from '@/components/form/SelectForm'
import { httpClient } from '@/lib/httpClient'
import { toastValidation } from '@/lib/action/clientHelper'
import { toast } from 'sonner'
import { CATEGORIES } from '@/lib/constant'
import { TextAreaForm } from '@/components/form/TextAreaForm'

interface Props {
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>
  initialData: Partial<ExpenseFormData> | null
  receipt: File | null,
  onUpdate: () => void
}

const CreateModal: NextPage<Props> = ({ open, setOpen, initialData, receipt, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const { data: accounts } = useAccount()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    control
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema) as any,
    // defaultValues: {
    //   amount: initialData?.amount || 0,
    //   date: initialData?.date,
    //   description: initialData?.description || '',
    //   items: initialData?.items || [],
    //   merchant: initialData?.merchant || '',
    //   title: initialData?.title || '',
    // },

  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });
  useEffect(() => {
    if (initialData) {
      console.log('init', initialData)
      //       {
      //     "title": "Pizza Tarik Krian",
      //     "date": "07-03-2026 15:16",
      //     "merchant": "Pizza Tarik",
      //     "amount": 39000,
      //     "description": "salsa Take Away",
      //     "items": [
      //         {
      //             "name": "Classic Cheese",
      //             "amount": 17000
      //         },
      //         {
      //             "name": "Pepperoni Party",
      //             "amount": 22000
      //         }
      //     ]
      // }
      reset({
        amount: initialData.amount || 0,
        date: initialData.date,
        description: initialData.description || '',
        items: initialData.items || [],
        merchant: initialData.merchant || '',
        title: initialData.title || '',
      });
    }
  }, [initialData, reset]);
  const [file, setFile] = useState<File | null>(null)
  useEffect(() => {
    setFile(receipt)
  }, [receipt])
  const onSubmit = async (formdata: ExpenseFormData) => {
    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("source", formdata.title)
      formData.append("type", 'EXPENSE')
      formData.append("date", formdata.date)
      formData.append('amount', String(formdata.amount))
      formData.append("accountId", String(formdata.accountId))
      formData.append("categoryId", String(formdata.accountId))
      const receptObj = {
        merchant: formdata.merchant,
        total: formdata.amount,
        date: formdata.date,
        items: formdata.items ?? []
      }
      formData.append('receipt', JSON.stringify(receptObj))

      if (file) {
        formData.append("receipt_image", file)
      }

      const { data, status, message, errors } = await httpClient.post('/transactions', formData)
      if (status === 200) {
        toast.success('Success create expense')
        onUpdate?.()
        setOpen(false)
        return
      }
      toast.error(message)
      toastValidation(errors)
      setOpen(false)
    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="space-y-3 w-full max-w-4xl!">
        <DialogHeader>
          <DialogTitle>Create Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='flex gap-4'>
          <div className='w-full max-w-xs space-y-3'>
            <InputForm
              config={{
                title: "Title",
                name: "title",
                type: 'text',
                registerConfig: {
                  required: 'required'
                },
                error: errors.title
              }}
              register={register}
            />
            <SelectForm
              control={control}
              name="accountId"
              options={accounts.map((c) => ({
                id: c.id.toString(),
                name: `${c.description} (${c.type.toLowerCase()})`
              }))}
              label="Account"
              rules={{
                required: "field is required"
              }}
            />
            {/* Title */}
            <DateTimeField
              control={control}
              label='Date'
              name='date'
              mode='datetime'
              valueType='string'
            />

            <InputForm
              config={{
                title: 'Merchant',
                name: "merchant",
                type: 'text',
                registerConfig: {
                  required: 'required'
                },
                error: errors.merchant
              }}
              register={register}
            />
            <CurrencyForm
              control={control}
              register={register}
              name='amount'
              error={errors.amount}
              label='Amount'
              min={1}
              registerConfig={{
                required: 'required'
              }}
            />
            {/* File Upload */}
            <div className='space-y-2'>
              <Label>Receipt</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={!!receipt}
              />
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </Button>
          </div>
          <div className="space-y-2 w-full">
            <div>
              <div className="flex justify-between items-center">
                <Label >Items</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => append({ name: "", amount: 0 })}
                >
                  + Add
                </Button>
              </div>

              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-2 text-sm font-medium border-b">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-4">Amount</div>
                  <div className="col-span-2 text-center">Action</div>
                </div>

                {fields.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-2 p-2 border-b last:border-none"
                  >
                    {/* Name */}
                    <InputForm
                      register={register}
                      config={{
                        name: `items.${index}.name`,
                        type: 'text',
                        error: errors.items?.[index]?.name,
                        registerConfig: {
                          required: 'required'
                        },
                        // title: 'Name',
                      }}
                    />
                    {/* Amount */}
                    <CurrencyForm
                      control={control}
                      name={`items.${index}.amount`}
                      register={register}
                      error={errors.items?.[index]?.amount}
                      // label='Amount'
                      min={1}
                      registerConfig={{
                        required: 'required'
                      }}
                    />

                    {/* Delete */}
                    <div className="col-span-2 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <TextAreaForm control={control} name='description' rows={3} label='Description' />
          </div>
        </form>
      </DialogContent>
    </Dialog >
  )
}

export default CreateModal