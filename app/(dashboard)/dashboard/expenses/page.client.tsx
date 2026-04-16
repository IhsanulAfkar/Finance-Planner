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

  const { data: expenses, isLoading: isLoadingExpenses, refetch: refetchExpenses, filter: filterExpenses } = useTransaction({ type: 'EXPENSE' })
  const abortControllerRef = useRef<AbortController | null>(null);
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
        <CreateModal open={createModal} setOpen={setCreateModal} initialData={initialData} receipt={receipt} onUpdate={refetchExpenses} />
      }
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses & Receipts</h1>
        <p className="text-gray-600 mt-1">Upload receipts to automatically track your expenses with AI</p>
      </div>

      {/* Upload Area */}

      <div
        className={`bg-white rounded-xl p-8 border-2 border-dashed transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Receipt</h3>
            <p className="text-gray-600 mb-4">Drag and drop your receipt image or click to browse</p>
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
            <p className="text-sm text-gray-500 mt-3">Supports JPG, PNG, PDF formats</p>
          </div>

        }
      </div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign className="text-red-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Tag className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">Receipts Scanned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-600">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatIDR(expenses.filter((r) => isSameMonth(r.date)).reduce((sum, r) => sum + r.amount, 0))}
          </p>
        </div>
      </div>

      {/* Receipts List */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h2>
        <div className="space-y-4">
          {expenses.map((receipt) => (
            <ExpenseCard data={receipt} key={receipt.id} onDelete={refetchExpenses} />
          ))}
        </div>
      </div>
    </div>
  );
}
