"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/components/language-provider"
import { Trophy } from "lucide-react"

interface UserLevelProps {
  user: {
    level: number
    points: number
  } | null
}

export function UserLevel({ user }: UserLevelProps) {
  const { t } = useLanguage()

  if (!user) return null

  // Calculate progress to next level (example calculation)
  const pointsToNextLevel = user.level * 100
  const currentLevelPoints = (user.level - 1) * 100
  const progress = ((user.points - currentLevelPoints) / (pointsToNextLevel - currentLevelPoints)) * 100

  return (
    <Card className="w-full md:w-auto">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex items-center justify-center bg-primary/10 rounded-full p-3">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">
              {t("dashboard.level")} {user.level}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.points} {t("dashboard.points")}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

