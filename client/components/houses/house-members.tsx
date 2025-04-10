"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { UserPlus, X } from "lucide-react"
import api from "@/lib/api"

interface HouseMembersProps {
  houseId: string
  members: any[]
  setMembers: (members: any[]) => void
}

export function HouseMembers({ houseId, members, setMembers }: HouseMembersProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isOwner = members.find((m) => m.userId === user?.id)?.role === "owner"
  const isAdmin = members.find((m) => m.userId === user?.id)?.role === "admin" || isOwner

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Email is required",
      })
      return
    }

    try {
      setIsLoading(true)
      await api.houses.inviteMember(houseId, email, role)

      toast({
        title: t("common.success"),
        description: "Invitation sent successfully",
      })

      setEmail("")
      setRole("member")
      setIsDialogOpen(false)

      // Refresh members list
      const updatedMembers = await api.houses.getMembers(houseId)
      setMembers(updatedMembers)
    } catch (error) {
      console.error("Error inviting member:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to send invitation",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await api.houses.updateMember(houseId, memberId, newRole)

      toast({
        title: t("common.success"),
        description: "Member role updated",
      })

      // Update local state
      setMembers(members.map((member) => (member.userId === memberId ? { ...member, role: newRole } : member)))
    } catch (error) {
      console.error("Error updating member role:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to update member role",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.houses.removeMember(houseId, memberId)

      toast({
        title: t("common.success"),
        description: "Member removed",
      })

      // Update local state
      setMembers(members.filter((member) => member.userId !== memberId))
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: "Failed to remove member",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("house.members")}</h2>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("house.invite")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("house.invite")}</DialogTitle>
                <DialogDescription>Invite someone to join this house</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{t("house.member")}</SelectItem>
                        <SelectItem value="admin">{t("house.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t("common.loading") : t("house.invite")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.userId} className="flex items-center p-4 hover:bg-muted/50">
                <Avatar className="mr-4">
                  <AvatarImage src={member.user?.avatar} />
                  <AvatarFallback>{member.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{member.user?.name}</div>
                  <div className="text-sm text-muted-foreground">{member.user?.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && member.userId !== user?.id ? (
                    <>
                      <Select value={member.role} onValueChange={(value) => handleUpdateRole(member.userId, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">{t("house.member")}</SelectItem>
                          <SelectItem value="admin">{t("house.admin")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.userId)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="px-3 py-1 bg-muted rounded text-sm">{t(`house.${member.role}`)}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

