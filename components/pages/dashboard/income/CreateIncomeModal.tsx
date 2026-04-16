import CurrencyForm from '@/components/form/CurrencyForm';
import { DateTimeField } from '@/components/form/DateTimeField';
import InputForm from '@/components/form/InputForm';
import { SelectForm } from '@/components/form/SelectForm';
import { TextAreaForm } from '@/components/form/TextAreaForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import useAccount from '@/hooks/datasource/useAccount';
import useSavingsGoal from '@/hooks/datasource/useSavingsGoal';
import { toastValidation } from '@/lib/action/clientHelper';
import { CATEGORIES } from '@/lib/constant';
import { httpClient } from '@/lib/httpClient';
import { IncomeFormData, incomeSchema } from '@/lib/validation/income';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { NextPage } from 'next'
import { Path, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
  open: boolean,
  setOpen: (b: boolean) => void,
  onSuccess?: () => void
}

const CreateIncomeModal: NextPage<Props> = ({ open, setOpen, onSuccess }) => {

  const { data: savingsGoals } = useSavingsGoal()
  const { data: accounts } = useAccount()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    control
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: {
      source: "",
      amount: 0,
      category: "Salary",
      date: new Date().toISOString().split("T")[0],
      frequency: "monthly",
      description: "",
      savingsAllocations: []
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "savingsAllocations"
  });
  const onSubmit = async (data: IncomeFormData) => {
    const totalSavings = data.savingsAllocations?.reduce((sum, item) => sum + item.amount, 0) || 0;

    if (totalSavings > data.amount) {
      toast.error("Total savings cannot exceed income amount");
      return;
    }
    try {

      const payload = {
        accountId: data.accountId,
        amount: data.amount,
        type: "INCOME",
        source: data.source,
        date: data.date,
        description: data.description,
        // Map frontend camelCase to backend snake_case if necessary
        savingsAllocations: data.savingsAllocations?.map(item => ({
          goalId: Number(item.savingsGoalId),
          amount: item.amount
        })) || []
      };
      const { status, errors, message } = await httpClient.post("/transactions", payload)
      if (status === 200) {
        toast.success("Success add income")
        onSuccess?.()
        reset();
        setOpen(false)
        return
      }
      toast.error(message)
      toastValidation(errors)

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className='w-full max-w-2xl!'>
      <DialogHeader>
        <DialogTitle>Create Income</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Income Source */}
          <div>
            <InputForm
              register={register}
              config={{
                name: 'source',
                type: 'text',
                error: errors.source,
                registerConfig: {
                  required: "field is required"
                },
                placeholder: "Ex: Monthly Salary",
                title: "Income Source"
              }}
            />
          </div>
          <div>
            <SelectForm
              control={control}
              name="accountId"
              options={accounts.map((c) => ({
                id: c.id.toString(),
                name: `${c.description} (${c.type})`
              }))}
              label="Account"
              rules={{
                required: "field is required"
              }}
            />

          </div>
          {/* Amount */}
          <div>
            <CurrencyForm
              control={control}
              name="amount"
              label="Amount"
              register={register}
              error={errors.amount}
              min={1}
            />
          </div>

          {/* Category */}
          <div>
            <SelectForm
              control={control}
              name="category"
              options={CATEGORIES.map((c) => ({
                id: c,
                name: c
              }))}
              label="Category"
              rules={{
                required: "field is required"
              }}
            />

          </div>
          <div>
            <DateTimeField
              control={control}
              label="Date"
              name="date"
              mode="date"
              valueType="string"
              registerConfig={{
                required: "field is required"
              }}
            />
          </div>
          <div>
            <SelectForm
              control={control}
              name="frequency"
              label="Frequency"
              rules={{
                required: "Field is required"
              }}
              options={[
                {
                  id: "one-time",
                  name: "One Time"
                },
                {
                  id: "weekly",
                  name: "Weekly"
                },
                {
                  id: "monthly",
                  name: "Monthly"
                },
                {
                  id: "yearly",
                  name: "Yearly"
                },
              ]}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <TextAreaForm
              control={control}
              name="description"
              rows={3}
              label="Description"
            />
          </div>

          {/* Allocate to Savings */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Savings Allocations</h3>
              <Button
                type="button"
                onClick={() => append({ savingsGoalId: "", amount: 0 })}
                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200"
              >
                + Add Goal
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-3 items-end">
                <div className="md:col-span-4">
                  <SelectForm
                    control={control}
                    name={`savingsAllocations.${index}.savingsGoalId`}
                    options={savingsGoals.map(s => ({
                      id: s.id,
                      name: s.title
                    }))}
                    label="Savings Goal"
                    rules={{
                      required: "field is required"
                    }}
                  />

                </div>

                <div className="md:col-span-2">
                  <CurrencyForm
                    control={control}
                    name={`savingsAllocations.${index}.amount` as Path<IncomeFormData>}
                    label="Amount"
                    register={register}
                    error={errors.savingsAllocations?.[index]?.amount}
                    min={1}
                    registerConfig={{
                      required: "Required"
                    }}
                  />

                </div>

                <Button
                  type="button"
                  size={'icon'}
                  variant={'destructive'}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button type="button" onClick={() => reset()} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg">
            Cancel
          </Button>
          <Button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Add Income
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}

export default CreateIncomeModal