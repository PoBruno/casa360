"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"

export function LandingHero() {
  const { t } = useLanguage()
  const { user } = useAuth()

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              {t("landing.title")}
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">{t("landing.subtitle")}</p>
          </div>
          <p className="mx-auto max-w-[700px] text-muted-foreground">{t("landing.description")}</p>
          <div className="space-x-4">
            {user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">{t("common.dashboard")}</Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/signup">{t("landing.getStarted")}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

