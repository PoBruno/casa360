"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { Calendar, Trophy } from "lucide-react"
import api from "@/lib/api"

interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  status: string
  priority: string
  points: number
  houseId: string
}

interface TaskListProps {
  tasks: Task[]
  onTaskComplete?: (task: Task) => void
}

export function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})

  const handleTaskComplete = async (task: Task) => {
    try {
      await api.tasks.complete(task.houseId, task.id)
      setCompletedTasks({ ...completedTasks, [task.id]: true })

      toast({
        title: "Task completed",
        description: `You earned ${task.points} points!`,
      })

      if (onTaskComplete) {
        onTaskComplete(task)
      }
    } catch (error) {
      console.error("Error completing task:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to complete task",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center p-4 hover:bg-muted/50 ${completedTasks[task.id] ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={completedTasks[task.id] || task.status === "done"}
                onCheckedChange={() => handleTaskComplete(task)}
                disabled={completedTasks[task.id] || task.status === "done"}
                className="mr-4"
              />
              <div className="flex-1">
                <div className="font-medium">{task.title}</div>
                {task.description && <div className="text-sm text-muted-foreground">{task.description}</div>}
                {task.dueDate && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {task.points}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>{t(`tasks.${task.priority.toLowerCase()}`)}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

