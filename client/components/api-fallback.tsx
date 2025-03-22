"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WifiOff, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function ApiFallback({ children }: { children: React.ReactNode }) {
  const { checkApiConnection, isOfflineMode } = useAuth()
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    try {
      const isConnected = await checkApiConnection()
      setApiConnected(isConnected)
    } catch (error) {
      console.error("Error checking connection:", error)
      setApiConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Check API connection when component mounts
    checkConnection()
  }, [])

  // If we haven't checked yet, show a loading state
  if (apiConnected === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Checking connection...</span>
      </div>
    )
  }

  // If connected, show the children
  if (apiConnected) {
    return <>{children}</>
  }

  // If not connected, show the fallback
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <WifiOff className="h-5 w-5 mr-2 text-red-500" />
          Connection Error
        </CardTitle>
        <CardDescription>We're having trouble connecting to the server</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>Unable to reach the API server</AlertTitle>
          <AlertDescription>
            This could be due to:
            <ul className="list-disc pl-5 mt-2">
              <li>Your internet connection is offline</li>
              <li>The API server is down or unreachable</li>
              <li>There's a network issue between your device and the server</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button onClick={checkConnection} disabled={isChecking}>
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

