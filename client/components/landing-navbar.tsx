"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"

export function LandingNavbar() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Home className="h-6 w-6" />
          <span>Casa360</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
            {mounted ? t("landing.features") : "Features"}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {mounted && user ? (
            <Button asChild>
              <Link href="/dashboard">{t("common.dashboard")}</Link>
            </Button>
          ) : mounted ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">{t("common.signup")}</Link>
              </Button>
            </>
          ) : (
            <Button disabled>Loading...</Button>
          )}
        </div>
      </div>
    </header>
  )
}

