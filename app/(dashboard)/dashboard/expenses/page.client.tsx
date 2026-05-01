'use client'
import { useRef, useState } from "react";
import { Upload, Scan, Check, X, Calendar, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CreateModal from "@/components/pages/dashboard/expense/CreateModal";
import { ExpenseFormData } from "@/lib/validation/expense";
import { Spinner } from "@/components/ui/spinner";
import { httpClient } from "@/lib/httpClient";
import useTransaction from "@/hooks/datasource/useTransaction";
import { formatIDR, isSameMonth } from "@/lib/utils";
import ExpenseCard from "@/components/pages/dashboard/expense/ExpenseCard";
import { Card, CardContent } from "@/components/ui/card";
import { DataPagination } from "@/components/default/DataPagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Receipt {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  items: string[];
  imageUrl?: string;
  status: "scanning" | "completed" | "failed";
}

export default function PageClient() {
  const [createModal, setCreateModal] = useState(false)
  const [initialData, setInitialData] = useState<Partial<ExpenseFormData> | null>(null)
  const [isDragging, setIsDragging] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const { data: expenses, isLoading: isLoadingExpenses, refetch: refetchExpenses, filter: filterExpenses, meta: metaExpenses } = useTransaction({ type: 'EXPENSE' })
  const abortControllerRef = useRef<AbortController | null>(null);
  const expenseTableRef = useRef<HTMLDivElement | null>(null)
  const handleFileUpload = async (files: FileList | null) => {
    try {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setIsScanning(true);
      setReceipt(file);

      const formData = new FormData();
      formData.set('image', file);

      // ✅ create controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { data, status, message } =
        await httpClient.post<Partial<ExpenseFormData>>(
          '/scan/image',
          formData,
          {
            signal: controller.signal, // ✅ attach signal
          }
        );
      if (status === 200) {
        setInitialData(data);
        setCreateModal(true);
        return;
      }

      toast.error(message);
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        console.error('Request canceled');
      } else {
        console.error(error);
        toast.error("Something Wrong");
      }
    } finally {
      setIsScanning(false);
      // setReceipt(null);
      abortControllerRef.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteReceipt = (id: string) => {
    toast.success("Receipt deleted");
  };

  const totalExpenses = expenses
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="w-full mx-auto space-y-6">
      {createModal &&
        <CreateModal open={createModal} setOpen={setCreateModal} initialData={initialData} receipt={receipt} onUpdate={() => {
          refetchExpenses()
          setInitialData(null)
        }} />
      }
      <div>
        <h1 className="text-3xl font-bold ">Expenses & Receipts</h1>
        <p className="text-muted-foreground mt-1">Upload receipts to automatically track your expenses with AI</p>
      </div>

      {/* Upload Area */}

      <div
        className={`bg-card text-card-foreground rounded-xl p-8 border-2 border-dashed transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isScanning ?
          <div className="flex flex-col gap-4 items-center justify-center py-4">
            <div className="flex gap-2 items-center">
              <Spinner />
              <p className="font-semibold text-lg text-gray-700">AI is Scanning Receipt....</p>
            </div>
            <div className="flex gap-2">
              <Button variant={'destructive'} onClick={() => {
                abortControllerRef.current?.abort();
                setIsScanning(false)
                setReceipt(null)
              }}>Cancel Process</Button>
            </div>
          </div> :
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
              <Upload className="text-blue-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Receipt</h3>
            <p className="text-muted-foreground mb-4">Drag and drop your receipt image or click to browse</p>
            <div className="flex gap-4 justify-center">
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                <Scan size={20} />
                <span>Scan Receipt</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
              <Button onClick={() => setCreateModal(true)} className="h-auto" variant={'outline'}>Input Directly</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">Supports JPG, PNG, PDF formats</p>
          </div>

        }
      </div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <DollarSign className="text-red-600" size={20} />
              </div>
              <span className="text-sm ">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold ">{formatIDR(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Tag className="text-blue-600" size={20} />
              </div>
              <span className="text-sm">Receipts Scanned</span>
            </div>
            <p className="text-2xl font-bold ">{expenses.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="text-green-600" size={20} />
              </div>
              <span className="text-sm">This Month</span>
            </div>
            <p className="text-2xl font-bold">
              {formatIDR(expenses.filter((r) => isSameMonth(r.date)).reduce((sum, r) => sum + r.amount, 0))}
            </p>

          </CardContent>
        </Card>
      </div>

      {/* Receipts List */}
      <Card ref={expenseTableRef}>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Recent Receipts</h2>
          {/* 🎛 FILTER CARD */}
          <div className="bg-card-2 border rounded-lg p-4 space-y-4 mb-4">
            <p className="font-semibold text-sm">Filters</p>

            {/* 💰 AMOUNT RANGE */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Amount Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  onChange={(e) =>
                    filterExpenses.setMinAmount(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  onChange={(e) =>
                    filterExpenses.setMaxAmount(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            {/* 📅 DATE RANGE */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Start Date</Label>

                  <Input
                    type="date"
                    onChange={(e) =>
                      filterExpenses.setStartDate(e.target.value || undefined)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">End Date</Label>

                  <Input
                    type="date"
                    onChange={(e) =>
                      filterExpenses.setEndDate(e.target.value || undefined)
                    }
                  />
                </div>
              </div>
            </div>

            {/* 🔽 SORT */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sort By</Label>
                <Select
                  onValueChange={(value) =>
                    filterExpenses.setSortBy(value as "amount" | "date")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Order</Label>
                <Select
                  defaultValue="desc"
                  onValueChange={(value) =>
                    filterExpenses.setOrder(value as "asc" | "desc")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* 🔍 SEARCH (separate & prominent) */}
          <div className="mb-4">
            <Input
              className="bg-card-2"
              placeholder="Search transactions..."
              onChange={(e) => filterExpenses.setSearch(e.target.value)}
            />
          </div>
          {/* 📦 LIST */}
          <div className="space-y-4 mb-4 pt-4 border-t">
            {isLoadingExpenses ? (
              [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border bg-card-2 rounded-lg p-4 flex items-center justify-between"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-3">


                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </div>
                </div>
              ))
            ) : expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No expenses found
              </p>
            ) : (
              expenses.map((receipt) => (
                <ExpenseCard
                  data={receipt}
                  key={receipt.id}
                  onDelete={refetchExpenses}
                />
              ))
            )}
          </div>

          {/* 📄 PAGINATION */}
          <DataPagination page={filterExpenses.page} setPage={filterExpenses.setPage} lastPage={metaExpenses?.totalPages} limit={filterExpenses.limit} setLimit={filterExpenses.setLimit} total={metaExpenses?.total} scrollOnChange tableRef={expenseTableRef} />
        </CardContent>
      </Card>
    </div >
  );
}
