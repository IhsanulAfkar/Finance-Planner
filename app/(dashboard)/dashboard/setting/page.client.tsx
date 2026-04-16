'use client'
import { useState, useEffect } from "react";
import { User, Upload, Plus, Edit2, Trash2, Save, Settings as SettingsIcon, Tag } from "lucide-react";
import { toast } from "sonner";
import useTransactionCategory from "@/hooks/datasource/useTransactionCategory";
import { iconOptions } from "@/components/pages/dashboard/setting/icon-options";
import IconSelect from "@/components/ui/custom/IconSelect";
import ColorPicker from "@/components/ui/custom/color-picker";
import PrintCategory from "@/components/ui/custom/print-category";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCOUNT_TYPE_LABEL } from "@/lib/constant";
import useAccount, { TAccount } from "@/hooks/datasource/useAccount";
import DeleteButton from "@/components/default/action/DeleteButton";
import { httpClient } from "@/lib/httpClient";
import useSavingsCategory from "@/hooks/datasource/useSavingsCategory";
import PrintSavingsCategory from "@/components/ui/custom/print-savings-category";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UserProfile {
  name: string;
  email: string;
  profilePicture: string;
}

export default function PageClient() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    profilePicture: "",
  });
  const { expense: expenseCategories, income: incomeCategories, refetch: refetchCategories } = useTransactionCategory()
  const [newAccount, setNewAccount] = useState({
    description: "",
    type: "CASH",
    balance: 0,
  })
  const { data: savingsCategories, refetch: refetchSavingsCategories } = useSavingsCategory()
  const { data: accounts, refetch: refetchAccounts } = useAccount()
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newExpenseColor, setNewExpenseColor] = useState("#10b981");
  const [newExpenseIcon, setNewExpenseIcon] = useState("utensils");

  const [newIncomeCategory, setNewIncomeCategory] = useState("");
  const [newIncomeColor, setNewIncomeColor] = useState("#3b82f6");
  const [newIncomeIcon, setNewIncomeIcon] = useState("salary");

  const [newSavingsCategory, setNewSavingsCategory] = useState("")

  const createAccount = async () => {
    if (!newAccount.description.trim()) {
      toast.error("Account name is required")
      return
    }

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAccount),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.message)

      toast.success("Account created")
      refetchAccounts()
      // reset
      setNewAccount({
        description: "",
        type: "CASH",
        balance: 0,
      })

      // optional: refetch accounts
    } catch (err: any) {
      toast.error(err.message)
    }
  }
  const addExpenseCategory = async () => {
    if (!newExpenseCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const res = await fetch("/api/transactions/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExpenseCategory,
          type: "EXPENSE",
          color: newExpenseColor,
          icon: newExpenseIcon,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast.success("Category added");
      setNewExpenseCategory("");
      refetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };


  const addIncomeCategory = async () => {
    if (!newIncomeCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const res = await fetch("/api/transactions/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newIncomeCategory,
          type: "INCOME",
          color: newIncomeColor,
          icon: newIncomeIcon,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast.success("Category added");
      setNewIncomeCategory("");
      refetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  const addSavingsCategory = async () => {
    if (!newSavingsCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const res = await fetch("/api/savings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSavingsCategory,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast.success("Category added");
      setNewSavingsCategory("");
      refetchSavingsCategories();
    } catch (err: any) {
      console.error(err)
      toast.error(err.message);
    }
  };
  const deleteAccount = async (account: TAccount) => {
    try {
      const res = await httpClient.delete(`/account/${account.id}`)

      if (res.status != 200) throw new Error(res.message)

      toast.success(res.message)
      refetchAccounts()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your profile and application preferences</p>
      </div>
      <div className="flex gap-4 lg:flex-row flex-col items-start">


        {/* User Profile Section */}
        <div className="bg-white w-full max-w-md rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload size={16} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                  />
                </label>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Profile Picture</p>
                <p className="text-sm text-gray-500">Click the upload icon to change your profile picture</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <button
              // onClick={saveProfile}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={18} />
              Save Profile
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {/* accounts */}
          <div className="bg-white rounded-xl p-6 w-full border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <SettingsIcon className="text-green-600" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
            </div>

            {/* Form */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              {/* Account Name */}
              <Input
                type="text"
                value={newAccount.description}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="flex-1 px-4 py-2 border rounded-lg"
                placeholder="Account name (e.g. BCA, Cash, E-Wallet)"
              />
              <Select value={newAccount.type} onValueChange={val => setNewAccount(prev => ({ ...prev, type: val }))}>
                <SelectTrigger className="">
                  <div className="flex items-center gap-2">

                    {/* Custom label */}
                    <span className="capitalize">
                      {newAccount.type.toLowerCase()}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_LABEL.map(a => <SelectItem key={a} value={a} className="">{a.toLocaleLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Balance */}
              <Input
                type="number"
                value={newAccount.balance}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    balance: Number(e.target.value),
                  }))
                }
                className="w-32 px-3 py-2 border rounded-lg"
                placeholder="Balance"
              />

              {/* Submit */}
              <Button
                onClick={createAccount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {accounts?.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {/* Left */}
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {account.description || "Unnamed Account"}
                    </span>

                    <span className="text-xs text-gray-500 capitalize">
                      {account.type.toLowerCase()}
                    </span>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    {/* Balance */}
                    <span className="font-semibold text-gray-800">
                      {formatIDR(account.balance)}
                    </span>

                    {/* Delete */}
                    <DeleteButton handler={() => deleteAccount(account)}>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </DeleteButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 w-full border border-gray-200 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Tag className="text-purple-600" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            </div>

            {/* Expense Categories */}
            <div className="">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Expense Categories</h3>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Category name"
                />
                <IconSelect value={newExpenseIcon} onChange={setNewExpenseIcon} />

                <ColorPicker onChange={setNewExpenseColor} value={newExpenseColor} />
                <button
                  onClick={addExpenseCategory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {expenseCategories.filter(c => c.type === 'EXPENSE').map((category, index) => (
                  <PrintCategory key={category.id} category={category} onUpdate={() => {
                    refetchCategories()
                  }} />
                ))}
              </div>
            </div>

            {/* Income Categories */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Income Categories</h3>

              {/* Input Row */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={newIncomeCategory}
                  onChange={(e) => setNewIncomeCategory(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Category name"
                />

                <IconSelect value={newIncomeIcon} onChange={setNewIncomeIcon} />
                <ColorPicker onChange={setNewIncomeColor} value={newIncomeColor} />

                <button
                  onClick={addIncomeCategory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {incomeCategories.map((category, index) => (
                  <PrintCategory key={category.id} category={category} onUpdate={() => {
                    refetchCategories()
                  }} />
                ))}
              </div>
            </div>
            {/* Savings Categories */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">Savings Categories</h3>

              {/* Input Row */}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={newSavingsCategory}
                  onChange={(e) => setNewSavingsCategory(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Category name"
                />

                {/* <IconSelect value={newIncomeIcon} onChange={setNewIncomeIcon} />
                <ColorPicker onChange={setNewIncomeColor} value={newIncomeColor} /> */}

                <button
                  onClick={addSavingsCategory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {savingsCategories.map((category, index) => (
                  <PrintSavingsCategory key={category.id} category={category} onUpdate={() => {
                    refetchCategories()
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div >
  );
}
