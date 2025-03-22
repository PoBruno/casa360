"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-provider"

export function OfflineBanner() {
  const { checkApiConnection, isOfflineMode } = useAuth()
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check API connection when component mounts
    const checkConnection = async () => {
      const isConnected = await checkApiConnection()
      setApiConnected(isConnected)

      // Reset dismissed state when connection is restored
      if (isConnected) {
        setDismissed(false)
      }
    }

    checkConnection()

    // Set up periodic connection checks
    const intervalId = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(intervalId)
  }, [checkApiConnection])

  if (apiConnected !== false || isOfflineMode === false || dismissed) return null

  return (
    <Alert variant="destructive" className="rounded-none">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You are offline</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>Some features may not be available until your connection is restored.</span>
        <button onClick={() => setDismissed(true)} className="text-xs underline">
          Dismiss
        </button>
      </AlertDescription>
    </Alert>
  )
}

