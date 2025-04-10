"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Server, Wifi, WifiOff } from "lucide-react"
import { API_BASE_URL, checkApiConnection } from "@/lib/api"

export function DebugApi() {
  const [apiUrl, setApiUrl] = useState<string>("")
  const [isChecking, setIsChecking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean | null
    error?: string
    details?: any
  }>({ connected: null })

  useEffect(() => {
    setApiUrl(API_BASE_URL || "")
  }, [])

  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    setConnectionStatus({ connected: null })

    try {
      const isConnected = await checkApiConnection()
      setConnectionStatus({ connected: isConnected })
    } catch (error) {
      console.error("Error checking connection:", error)
      setConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="h-5 w-5 mr-2" />
          API Connection Diagnostics
        </CardTitle>
        <CardDescription>Use this tool to diagnose API connection issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="font-medium">API URL:</div>
          <code className="bg-muted p-2 rounded text-sm break-all">{apiUrl || "Not set"}</code>
        </div>

        <div className="grid gap-2">
          <div className="font-medium">Connection Status:</div>
          {connectionStatus.connected === null ? (
            <div className="text-muted-foreground">Not checked yet</div>
          ) : connectionStatus.connected ? (
            <div className="flex items-center text-green-500">
              <Wifi className="h-4 w-4 mr-2" />
              Connected successfully
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <WifiOff className="h-4 w-4 mr-2" />
              Connection failed
              {connectionStatus.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>Error: {connectionStatus.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <div className="font-medium">Browser Network Status:</div>
          <div className={`flex items-center ${typeof navigator !== 'undefined' && navigator.onLine ? "text-green-500" : "text-red-500"}`}>
            {typeof navigator !== "undefined" ? (
              navigator.onLine ? (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Browser reports online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Browser reports offline
                </>
              )
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Status unknown
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={checkConnection} disabled={isChecking} className="w-full">
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking Connection...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check API Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

