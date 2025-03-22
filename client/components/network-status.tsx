"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function NetworkStatus() {
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

    // Set up periodic connection checks
    const intervalId = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  // Allow manual refresh
  const handleRefresh = () => {
    checkConnection()
  }

  if (apiConnected === null) return null

  return (
    <div
      className={`flex items-center gap-1 cursor-pointer ${apiConnected ? "text-green-500" : "text-red-500"}`}
      onClick={handleRefresh}
      title="Click to check connection"
    >
      {apiConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-xs">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-xs">Offline</span>
        </>
      )}
    </div>
  )
}

