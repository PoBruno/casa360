"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import translations from "@/lib/translations"

type Language = "pt-BR" | "en"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: "pt-BR",
  setLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useLocalStorage<Language>("language", "pt-BR")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Set the document language
    if (typeof document !== "undefined") {
      document.documentElement.lang = language
    }
  }, [language])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLanguage
    }
  }

  const t = (key: string) => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      if (value && value[k]) {
        value = value[k]
      } else {
        return key
      }
    }

    return typeof value === "string" ? value : key
  }

  // Provide a default context during server rendering
  const contextValue = {
    language,
    setLanguage,
    t,
  }

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  return context
}

