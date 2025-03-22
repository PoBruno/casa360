"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { Home, CheckSquare, Calendar, BarChart3, FileText, Settings, Trophy } from "lucide-react"

interface DashboardSidebarProps {
  mobile?: boolean
  onNavigate?: () => void
}

export function DashboardSidebar({ mobile, onNavigate }: DashboardSidebarProps) {
  const { t } = useLanguage()
  const pathname = usePathname()

  const links = [
    {
      href: "/dashboard",
      label: t("common.dashboard"),
      icon: <Home className="h-5 w-5" />,
      exact: true,
    },
    {
      href: "/dashboard/houses",
      label: t("common.houses"),
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/dashboard/tasks",
      label: t("common.tasks"),
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      href: "/dashboard/agenda",
      label: t("common.agenda"),
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: "/dashboard/finances",
      label: t("common.finances"),
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/dashboard/documents",
      label: t("common.documents"),
      icon: <FileText className="h-5 w-5" />,
    },
    {
      href: "/dashboard/achievements",
      label: t("common.dashboard.achievements"),
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      href: "/dashboard/settings",
      label: t("common.settings"),
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn("flex flex-col gap-2 py-2", mobile ? "px-2" : "w-[240px] border-r px-4 py-6 hidden md:flex")}>
      {links.map((link) => (
        <Button
          key={link.href}
          variant={isActive(link.href, link.exact) ? "secondary" : "ghost"}
          className="justify-start"
          asChild
          onClick={onNavigate}
        >
          <Link href={link.href}>
            {link.icon}
            <span className="ml-2">{link.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}

