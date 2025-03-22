"use client"

import { BarChart3, FileText, MonitorPlay, TrendingUp } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function LandingFeatures() {
  const { t } = useLanguage()

  const features = [
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: t("landing.featureFinance"),
      description: t("landing.featureFinanceDesc"),
    },
    {
      icon: <FileText className="h-10 w-10" />,
      title: t("landing.featureDocuments"),
      description: t("landing.featureDocumentsDesc"),
    },
    {
      icon: <MonitorPlay className="h-10 w-10" />,
      title: t("landing.featureServices"),
      description: t("landing.featureServicesDesc"),
    },
    {
      icon: <TrendingUp className="h-10 w-10" />,
      title: t("landing.featureInvestments"),
      description: t("landing.featureInvestmentsDesc"),
    },
  ]

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">{t("landing.features")}</h2>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 mt-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 rounded-lg p-4 transition-all hover:bg-muted"
            >
              <div className="text-primary">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

