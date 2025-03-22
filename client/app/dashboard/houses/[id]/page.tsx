"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { CheckSquare, Calendar, BarChart3, FileText, Users, Settings, Plus, ArrowLeft } from "lucide-react"
import { TaskList } from "@/components/dashboard/task-list"
import { HouseMembers } from "@/components/houses/house-members"
import { HouseSettings } from "@/components/houses/house-settings"
import api from "@/lib/api"

export default function HouseDetailPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [house, setHouse] = useState<any>(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const houseId = params.id as string

  useEffect(() => {
    const fetchHouseData = async () => {
      try {
        setIsLoading(true)
        const houseData = await api.houses.getById(houseId)
        setHouse(houseData)

        const [tasksData, membersData] = await Promise.all([api.tasks.getAll(houseId), api.houses.getMembers(houseId)])

        setTasks(tasksData)
        setMembers(membersData)
      } catch (error) {
        console.error("Error fetching house data:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: "Failed to load house data",
        })
        router.push("/dashboard/houses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseData()
  }, [houseId, router, toast, t])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-64 bg-muted rounded" />
        <div className="animate-pulse h-4 w-32 bg-muted rounded" />
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-40" />
        </Card>
      </div>
    )
  }

  if (!house) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={() => router.push("/dashboard/houses")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.houses")}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{house.name}</h1>
          <p className="text-muted-foreground">{house.description || ""}</p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">
            <CheckSquare className="mr-2 h-4 w-4" />
            {t("common.tasks")}
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <Calendar className="mr-2 h-4 w-4" />
            {t("common.agenda")}
          </TabsTrigger>
          <TabsTrigger value="finances">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t("common.finances")}
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            {t("common.documents")}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            {t("common.members")}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            {t("common.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">{t("common.tasks")}</h2>
            <Button asChild>
              <Link href={`/dashboard/houses/${houseId}/tasks/create`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("tasks.createTask")}
              </Link>
            </Button>
          </div>

          {tasks.length > 0 ? (
            <TaskList tasks={tasks} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tasks found</p>
                <Button asChild>
                  <Link href={`/dashboard/houses/${houseId}/tasks/create`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("tasks.createTask")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members">
          <HouseMembers houseId={houseId} members={members} setMembers={setMembers} />
        </TabsContent>

        <TabsContent value="settings">
          <HouseSettings house={house} setHouse={setHouse} />
        </TabsContent>

        {/* Other tabs will be implemented similarly */}
        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.agenda")}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This feature is under development</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.finances")}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This feature is under development</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>{t("common.documents")}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This feature is under development</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

