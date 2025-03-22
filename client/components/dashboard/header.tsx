"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"
import { DashboardSidebar } from "./sidebar"
import { NetworkStatus } from "@/components/network-status"

export function DashboardHeader() {
  const { t } = useLanguage()
  const { user, logout, isOfflineMode } = useAuth()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px] pr-0">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-8">
              <Home className="h-6 w-6" />
              <span>Casa360</span>
            </Link>
            <DashboardSidebar mobile onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold ml-2 md:ml-0">
          <Home className="h-6 w-6" />
          <span>Casa360</span>
        </Link>
        <div className="flex items-center ml-auto gap-2">
          <NetworkStatus />
          <LanguageSwitcher />
          <ThemeToggle />
          {mounted && user ? (
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={logout} disabled={isOfflineMode}>
                {t("common.logout")}
              </Button>
            </div>
          ) : (
            <Avatar>
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  )
}

