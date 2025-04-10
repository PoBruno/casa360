"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import api from "@/lib/api"

export default function JoinHousePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Invite code is required",
      })
      return
    }

    try {
      setIsLoading(true)
      const house = await api.houses.join(inviteCode)

      toast({
        title: t("common.success"),
        description: "Joined house successfully",
      })

      router.push(`/dashboard/houses/${house.id}`)
    } catch (error) {
      console.error("Error joining house:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to join house. Invalid invite code.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("house.joinTitle")}</CardTitle>
          <CardDescription>Enter the invite code to join a house</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">{t("house.inviteCode")}</Label>
              <Input id="inviteCode" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("common.join")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

