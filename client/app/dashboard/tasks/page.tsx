"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { CheckSquare, Plus } from "lucide-react"
import { TaskList } from "@/components/dashboard/task-list"
import api from "@/lib/api"

export default function TasksPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [houses, setHouses] = useState([])
  const [tasks, setTasks] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const housesData = await api.houses.getAll()
        setHouses(housesData)

        const tasksData = {}
        for (const house of housesData) {
          tasksData[house.id] = await api.tasks.getAll(house.id)
        }

        setTasks(tasksData)
      } catch (error) {
        console.error("Error fetching tasks:", error)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("common.tasks")}</h1>
        <Button asChild>
          <Link href="/dashboard/tasks/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("tasks.createTask")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="h-60" />
        </Card>
      ) : houses.length > 0 ? (
        <Tabs defaultValue={houses[0]?.id} className="space-y-4">
          <TabsList className="flex flex-wrap">
            {houses.map((house) => (
              <TabsTrigger key={house.id} value={house.id}>
                {house.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {houses.map((house) => (
            <TabsContent key={house.id} value={house.id} className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">
                  {house.name} - {t("common.tasks")}
                </h2>
                <Button asChild>
                  <Link href={`/dashboard/houses/${house.id}/tasks/create`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("tasks.createTask")}
                  </Link>
                </Button>
              </div>

              {tasks[house.id]?.length > 0 ? (
                <TaskList tasks={tasks[house.id]} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No tasks found</p>
                    <Button asChild>
                      <Link href={`/dashboard/houses/${house.id}/tasks/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("tasks.createTask")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You need to create or join a house first</p>
            <Button asChild>
              <Link href="/dashboard/houses">{t("common.houses")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

