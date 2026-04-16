'use client'
import { useState } from "react";
import { Target, Plus, Edit2, Trash2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import useSavingsCategory from "@/hooks/datasource/useSavingsCategory";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { httpClient } from "@/lib/httpClient";
import { useForm } from "react-hook-form";
import { SelectForm } from "@/components/form/SelectForm";
import InputForm from "@/components/form/InputForm";
import { DateTimeField } from "@/components/form/DateTimeField";
import CurrencyInput from "@/components/form/CurrencyForm";
import useSavingsGoal from "@/hooks/datasource/useSavingsGoal";
import { dateFormat, formatIDR } from "@/lib/utils";
import SavingsCard from "@/components/pages/dashboard/savings/SavingsCard";
import { Button } from "@/components/ui/button";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: string;
}
type FormValues = {
  name: string;
  category_id: string;
  target_amount: number;
  target_date: string;
  monthly_contribution?: number;
};
export default function PageClient() {
  const { data: categories } = useSavingsCategory()
  const { data: savingsGoals, isLoading: isLoadingSavingsGoal, refetch: refetchSavingsGoal, extras } = useSavingsGoal()

  const [showAddGoal, setShowAddGoal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
    control
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      category_id: "",
      target_amount: 0,
      target_date: "",
      monthly_contribution: 0,
    },
  });



  const onSubmit = async (data: FormValues) => {
    try {
      if (!data.name || !data.category_id || !data.target_amount) {
        toast.error("Please fill in all required fields");
        return;
      }

      const { message, status } = await httpClient.post("/savings/goal", {
        title: data.name,
        category_id: Number(data.category_id),
        target_amount: data.target_amount,
        date: data.target_date,
        monthly_target: data.monthly_contribution,
      });
      if (status != 200) {
        toast.error(message)
        return
      }
      const goal: SavingsGoal = {
        id: Date.now().toString(),
        name: data.name,
        targetAmount: data.target_amount,
        currentAmount: 0,
        targetDate: data.target_date,
        monthlyContribution: data.monthly_contribution || 0,
        category: data.category_id,
      };


      reset();
      setShowAddGoal(false);

      toast.success("Savings goal added!");
      refetchSavingsGoal()
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  const handleDeleteGoal = (id: string | number) => {
    toast.success("Goal deleted");
  };



  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Savings Planner</h1>
          <p className="text-gray-600 mt-1">Set goals and track your progress towards financial freedom</p>
        </div>

        <Button
          onClick={() => setShowAddGoal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="text-purple-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Goal Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(extras.total_amount)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Saved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(extras.total_current_amount)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Monthly Contributions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(extras.total_monthly_contribution)}</p>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Savings Goal</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Goal Name */}
              <InputForm register={register} config={{
                name: 'name',
                type: 'text',
                error: errors.name,
                registerConfig: {
                  required: "Required"
                },
                title: "Goal Name"
              }} />

              {/* Category */}
              <div className="space-y-2">
                {/* <Select
                  onValueChange={(val) => setValue("category_id", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                <SelectForm control={control} name="category_id" options={categories.map(c => ({
                  id: c.id,
                  name: c.name
                }))} label="Category" rules={{
                  required: 'Required'
                }} />
              </div>

              {/* Target Amount */}
              <CurrencyInput
                control={control}
                name="target_amount"
                label="Target Amount"
                register={register}
                error={errors.target_amount}
                registerConfig={{
                  required: 'Amount is required',
                  min: { value: 1000000, message: 'Minimum Rp 1.000.000' },
                }}
              />

              {/* Target Date */}
              <DateTimeField
                name="target_date"
                label="Target Date"
                mode="date"
                control={control}
                registerConfig={{
                  required: 'Date is required',
                }}
              />
              {/* <InputForm register={register} config={{
                name: 'target_date',
                type: 'number',
                error: errors.target_amount,
                registerConfig: {
                  required: "Required"
                },
                title: "Target Amount"
              }} /> */}

              {/* Monthly Contribution */}
              <CurrencyInput
                control={control}
                name="monthly_contribution"
                label="Monthly Contribution Target"
                register={register}
                error={errors.monthly_contribution}
              // min={1000000}
              />

            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Goal
              </button>

              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-6 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-6">
        {savingsGoals.map((goal) => <SavingsCard goal={goal} key={goal.id} onUpdate={() => {
          refetchSavingsGoal()
        }} />)}
      </div>

      {savingsGoals.length === 0 && !showAddGoal && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <Target size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No savings goals yet</h3>
          <p className="text-gray-600 mb-6">Start planning for your future by adding your first savings goal</p>
          <button
            onClick={() => setShowAddGoal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}
