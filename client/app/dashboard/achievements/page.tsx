"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"
import { Trophy, Lock, CheckCircle } from "lucide-react"
import { UserLevel } from "@/components/dashboard/user-level"
import api from "@/lib/api"

export default function AchievementsPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [achievementsData, userAchievementsData] = await Promise.all([
          api.gamification.getAchievements(),
          api.gamification.getUserAchievements(),
        ])

        setAchievements(achievementsData)
        setUserAchievements(userAchievementsData)
      } catch (error) {
        console.error("Error fetching achievements:", error)
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: "Failed to load achievements",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, t])

  const hasAchievement = (achievementId) => {
    return userAchievements.some((ua) => ua.achievementId === achievementId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.achievements")}</h1>
          <p className="text-muted-foreground">Complete tasks and earn achievements</p>
        </div>
        <UserLevel user={user} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const achieved = hasAchievement(achievement.id)

            return (
              <Card key={achievement.id} className={achieved ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className={`h-5 w-5 ${achieved ? "text-primary" : "text-muted-foreground"}`} />
                      {achievement.name}
                    </CardTitle>
                    {achieved ? (
                      <Badge className="bg-primary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Achieved
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div>Progress</div>
                    <div>{achieved ? "Completed" : `${achievement.progress || 0}/${achievement.target}`}</div>
                  </div>
                  <Progress
                    value={achieved ? 100 : ((achievement.progress || 0) / achievement.target) * 100}
                    className="h-2"
                  />
                  <div className="mt-2 text-sm text-muted-foreground">Reward: {achievement.points} points</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

