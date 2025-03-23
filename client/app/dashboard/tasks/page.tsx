"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { CheckSquare, Plus } from "lucide-react"
import { TaskList } from "@/components/dashboard/task-list"
import Link from "next/link"
import api from "@/lib/api"

export default function TasksPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [houses, setHouses] = useState<any[]>([])
  const [tasks, setTasks] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get all houses first
        const housesResponse = await api.houses.getAll()
        
        // Log the response for debugging
        console.log("Houses API response:", housesResponse)
        
        // Extract houses array from response
        const housesData = housesResponse?.houses || []
        setHouses(housesData)
        
        // Collect tasks from each house
        const allTasks: Record<string, any[]> = {}
        for (const house of housesData) {
          if (house.id) {
            try {
              console.log(`Fetching tasks for house: ${house.id}`)
              const tasksData = await api.tasks.getAll(house.id)
              console.log(`Tasks for house ${house.id}:`, tasksData)
              
              // Handle different response structures
              const tasksArray = tasksData?.tasks || tasksData || []
              
              // Add house ID and house name to each task
              const tasksWithHouseId = Array.isArray(tasksArray) 
                ? tasksArray.map((task: any) => ({
                    ...task, 
                    houseId: house.id,
                    houseName: house.house_name || house.name
                  }))
                : []
              
              allTasks[house.id] = tasksWithHouseId
            } catch (error) {
              console.warn(`Could not fetch tasks for house ${house.id}:`, error)
              allTasks[house.id] = []
            }
          }
        }
        setTasks(allTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        setError(error instanceof Error ? error.message : String(error))
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: "Failed to load tasks",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, t])

  // Flatten tasks from all houses into a single array
  const allTasks = Object.values(tasks).flat()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("common.tasks")}</h1>
        <div className="flex gap-2">
          {houses.length > 0 && (
            <Button asChild>
              <Link href={`/dashboard/houses/${houses[0].id}/tasks/create`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("tasks.createTask")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-red-500">
            <p>Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="h-60" />
        </Card>
      ) : allTasks.length > 0 ? (
        <TaskList tasks={allTasks} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("tasks.noTasks") || "No tasks found"}</p>
            {houses.length > 0 && (
              <Button asChild>
                <Link href={`/dashboard/houses/${houses[0].id}/tasks/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("tasks.createTask")}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

