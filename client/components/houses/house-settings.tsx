"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"
import { Copy, Trash } from "lucide-react"
import api from "@/lib/api"

interface HouseSettingsProps {
  house: any
  setHouse: (house: any) => void
}

export function HouseSettings({ house, setHouse }: HouseSettingsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(house.name)
  const [description, setDescription] = useState(house.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isOwner = house.members?.find((m: any) => m.userId === user?.id)?.role === "owner"

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "House name is required",
      })
      return
    }

    try {
      setIsLoading(true)
      const updatedHouse = await api.houses.update(house.id, { name, description })

      setHouse({ ...house, ...updatedHouse })

      toast({
        title: t("common.success"),
        description: "House updated successfully",
      })
    } catch (error) {
      console.error("Error updating house:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to update house",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await api.houses.delete(house.id)

      toast({
        title: t("common.success"),
        description: "House deleted successfully",
      })

      router.push("/dashboard/houses")
    } catch (error) {
      console.error("Error deleting house:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to delete house",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleLeave = async () => {
    try {
      setIsLoading(true)
      await api.houses.leave(house.id)

      toast({
        title: t("common.success"),
        description: "Left house successfully",
      })

      router.push("/dashboard/houses")
    } catch (error) {
      console.error("Error leaving house:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to leave house",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = () => {
    if (house.inviteCode) {
      navigator.clipboard.writeText(house.inviteCode)
      toast({
        title: t("common.success"),
        description: "Invite code copied to clipboard",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("common.settings")}</CardTitle>
          <CardDescription>Manage your house settings</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("house.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!isOwner} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("house.description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={!isOwner}
              />
            </div>
            {house.inviteCode && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t("house.inviteCode")}</Label>
                <div className="flex">
                  <Input id="inviteCode" value={house.inviteCode} readOnly className="rounded-r-none" />
                  <Button type="button" variant="secondary" className="rounded-l-none" onClick={copyInviteCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          {isOwner && (
            <CardFooter className="flex justify-between">
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    {t("house.delete")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete House</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this house? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                      {t("common.cancel")}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                      {isLoading ? t("common.loading") : t("common.delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("common.loading") : t("common.save")}
              </Button>
            </CardFooter>
          )}
          {!isOwner && (
            <CardFooter>
              <Button type="button" variant="destructive" onClick={handleLeave} disabled={isLoading}>
                {isLoading ? t("common.loading") : t("house.leave")}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  )
}

