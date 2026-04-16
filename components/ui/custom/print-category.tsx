"use client"

import { iconOptions } from '@/components/pages/dashboard/setting/icon-options'

import { TTransactionCategory } from '@/hooks/datasource/useTransactionCategory'
import { Edit2, Save, Tag, Trash2, X } from 'lucide-react'
import { NextPage } from 'next'
import { useState } from 'react'
import { toast } from 'sonner'
import IconSelect from './IconSelect'
import ColorPicker from './color-picker'
import { httpClient } from '@/lib/httpClient'

interface Props {
  category: TTransactionCategory
  onUpdate?: () => void
}

const PrintCategory: NextPage<Props> = ({ category, onUpdate }) => {
  const [editCategory, setEditCategory] = useState(category)
  const [isEditing, setIsEditing] = useState(false)

  const updateCategory = async () => {
    if (!editCategory.name.trim()) {
      toast.error("Category cannot be empty")
      return
    }

    try {
      const res = await httpClient.put(`/transactions/categories/${editCategory.id}`, {
        name: editCategory.name,
        icon: editCategory.icon,
        color: editCategory.color,
        type: editCategory.type
      })
      if (res.status != 200) throw new Error(res.message)

      toast.success("Category updated")
      setIsEditing(false)
      onUpdate?.()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
    }
  }

  const deleteCategory = async () => {
    try {
      const { data, status, message } = await httpClient.delete(`/transactions/categories/${category.id}`)

      if (status != 200) throw new Error(message)

      toast.success("Category deleted")
      onUpdate?.()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const Icon =
    iconOptions.find((i) => i.name === category.icon)?.icon || Tag

  return (
    <div className="flex flex-col gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors" style={{
      borderColor: category.color || 'gray'
    }}>
      {isEditing ? (
        <>
          {/* Name */}
          <input
            type="text"
            value={editCategory.name}
            onChange={(e) =>
              setEditCategory((prev) => ({ ...prev, name: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") updateCategory()
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            autoFocus
          />

          {/* Icon + Color */}
          <div className="flex gap-2">
            <IconSelect
              value={editCategory.icon}
              onChange={(val) =>
                setEditCategory((prev) => ({ ...prev, icon: val }))
              }
            />

            <ColorPicker
              value={editCategory.color || "#000000"}
              onChange={(val) =>
                setEditCategory((prev) => ({ ...prev, color: val }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={updateCategory}
              className="p-2 hover:bg-green-50 rounded"
            >
              <Save size={16} className="text-green-600" />
            </button>

            <button
              onClick={() => {
                setEditCategory(category) // reset changes
                setIsEditing(false)
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon
                size={16}
              />
              <p className='font-semibold'>

                {category.name}
              </p>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <Edit2 size={16} className="text-gray-600" />
              </button>

              <button
                onClick={deleteCategory}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <Trash2 size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PrintCategory