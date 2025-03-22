"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"
import { Home, Plus, CheckSquare } from "lucide-react"
import { HouseCard } from "@/components/dashboard/house-card"
import { TaskList } from "@/components/dashboard/task-list"
import { UserLevel } from "@/components/dashboard/user-level"
import api from "@/lib/api"

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [houses, setHouses] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const housesData = await api.houses.getAll()
        setHouses(housesData)

        // Get tasks from the first house if available
        if (housesData.length > 0) {
          const tasksData = await api.tasks.getAll(housesData[0].id)
          setTasks(tasksData)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: "Failed to load dashboard data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, t])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome").replace("{{name}}", user?.name || "")}
          </h1>
          <p className="text-muted-foreground">{t("common.welcome")}</p>
        </div>
        <UserLevel user={user} />
      </div>

      <Tabs defaultValue="houses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="houses">{t("common.houses")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("common.tasks")}</TabsTrigger>
        </TabsList>
        <TabsContent value="houses" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">{t("dashboard.yourHouses")}</h2>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/houses/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.createHouse")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/houses/join">{t("dashboard.joinHouse")}</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted" />
                  <CardContent className="h-20" />
                </Card>
              ))}
            </div>
          ) : houses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {houses.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("dashboard.noHouses")}</p>
                <Button asChild>
                  <Link href="/dashboard/houses/create">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("dashboard.createHouse")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">{t("dashboard.upcomingTasks")}</h2>
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
          ) : tasks.length > 0 ? (
            <TaskList tasks={tasks} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tasks found</p>
                <Button asChild>
                  <Link href="/dashboard/tasks/create">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("tasks.createTask")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

