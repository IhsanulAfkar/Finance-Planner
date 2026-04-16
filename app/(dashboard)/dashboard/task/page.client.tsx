'use client'

import CreateTaskModal from '@/components/pages/dashboard/taks/CreateTaskModal'
import TaskCard from '@/components/pages/dashboard/taks/TaskCard'
import TaskDetailModal from '@/components/pages/dashboard/taks/TaskDetailModal'
import { Button } from '@/components/ui/button'
import useTasks, { TTask } from '@/hooks/datasource/useTasks'
import { closestCorners, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { NextPage } from 'next'
import { useState } from 'react'
import { useDroppable } from "@dnd-kit/core"
import DraggableTaskCard from '@/components/pages/dashboard/taks/DraggableTaskCard'
import { updateTaskStatus } from '@/lib/action/clientAction'
import { ColumnSkeleton } from '@/components/ui/custom/skeleton'
import RenderStatus from '@/components/ui/custom/render-status'

const Column = ({ status, tasks, openTask }: {
  openTask: (task: TTask) => void,
  tasks: TTask[],
  status: string
}) => {
  const { setNodeRef } = useDroppable({
    id: status
  })

  return (
    <div
      ref={setNodeRef}
      className="w-[320px] shrink-0 flex flex-col rounded-xl border bg-muted/40"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur sticky top-0 rounded-t-xl">
        <RenderStatus status={status} className='font-semibold text-sm tracking-wide' />

        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto h-[75vh] overflow-x-hidden">
        {tasks.map((task: TTask) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onClick={() => openTask(task)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
const PageClient: NextPage = () => {
  const { data, refetch, isLoading } = useTasks()
  const [activeTask, setActiveTask] = useState<TTask | null>(null)
  const [openCreateTask, setOpenCreateTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TTask | null>(null)
  const [openDetail, setOpenDetail] = useState(false)

  const groupTasks = {
    Pending: data
      .filter(t => t.status === "Pending")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

    Ongoing: data
      .filter(t => t.status === "Ongoing")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

    Completed: data
      .filter(t => t.status === "Completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };

  const openTask = (task: TTask) => {
    setSelectedTask(task)
    setOpenDetail(true)
  }
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveTask(null)
    if (!over) return

    const taskId = active.id
    const newStatus = over.id

    if (!["Pending", "Ongoing", "Completed"].includes(newStatus as string)) return

    updateTaskStatus(Number(taskId), String(newStatus), () => { refetch() })
  }
  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task
    setActiveTask(task)
  }

  return (
    <div className="space-y-6">

      <div className='flex justify-between gap-4'>
        <p className='text-2xl font-semibold'>Manage My Tasks</p>
        <Button onClick={() => setOpenCreateTask(true)}>
          <Plus /> Create Task
        </Button>
      </div>

      {/* Kanban Layout */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 md:gap-12 overflow-x-auto 2xl:justify-center pb-4">
          {isLoading ? <>  <ColumnSkeleton />
            <ColumnSkeleton />
            <ColumnSkeleton /></> : <>
            {Object.entries(groupTasks).map(([status, tasks]) => (
              <Column
                key={status}
                status={status}
                tasks={tasks}
                openTask={openTask}
              />
            ))}
          </>}
        </div>

        {/* Floating Drag Card */}
        <DragOverlay>
          {activeTask ? (
            <div className="w-[320px]">
              <TaskCard
                task={activeTask}
                onClick={() => { }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <CreateTaskModal
        open={openCreateTask}
        setOpen={setOpenCreateTask}
        onUpdate={() => { }}
      />

      <TaskDetailModal
        open={openDetail}
        setOpen={setOpenDetail}
        task={selectedTask}
      />

    </div>
  )
}

export default PageClient