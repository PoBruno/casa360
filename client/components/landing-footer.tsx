"use client"

import Link from "next/link"
import { Home } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function LandingFooter() {
  const { t } = useLanguage()

  return (
    <footer className="w-full border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Home className="h-6 w-6" />
          <span>Casa360</span>
        </Link>
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Casa360. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

