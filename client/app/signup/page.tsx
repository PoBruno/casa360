"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-provider"
import { LandingNavbar } from "@/components/landing-navbar"

export default function SignupPage() {
  const { t } = useLanguage()
  const { signup, isLoading, checkApiConnection, isOfflineMode } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check API connection when component mounts
    const checkConnection = async () => {
      const isConnected = await checkApiConnection()
      setApiConnected(isConnected)
    }

    checkConnection()

    // Set up periodic connection checks
    const intervalId = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(intervalId)
  }, [checkApiConnection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isOfflineMode || apiConnected === false) {
      setError("Cannot connect to the server. Please check your internet connection and try again.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      await signup(name, email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t("common.signup")}</CardTitle>
              {apiConnected !== null &&
                (apiConnected ? (
                  <div className="flex items-center text-green-500">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <WifiOff className="h-4 w-4 mr-1" />
                    <span className="text-xs">Offline</span>
                  </div>
                ))}
            </div>
            <CardDescription>
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary hover:underline">
                {t("auth.loginNow")}
              </Link>
            </CardDescription>
          </CardHeader>
          {error && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {(isOfflineMode || apiConnected === false) && (
            <div className="px-6 mb-4">
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  Cannot connect to the server. Please check your internet connection and try again.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
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
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || isOfflineMode || apiConnected === false}>
                {isLoading ? t("common.loading") : t("common.signup")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

