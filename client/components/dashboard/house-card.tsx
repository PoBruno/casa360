"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Users } from "lucide-react"

interface HouseCardProps {
  house: {
    id: string
    name: string
    description?: string
    memberCount?: number
  }
}

export function HouseCard({ house }: HouseCardProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{house.name}</CardTitle>
        <CardDescription>{house.description || ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>
            {house.memberCount || 0} {t("common.members")}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/dashboard/houses/${house.id}`}>{t("common.dashboard")}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

