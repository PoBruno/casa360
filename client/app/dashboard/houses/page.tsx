"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { Home, Plus } from "lucide-react"
import { HouseCard } from "@/components/dashboard/house-card"
import api from "@/lib/api"

export default function HousesPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [houses, setHouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get house data with proper response structure handling
        const response = await api.houses.getAll()
        console.log("Houses API response:", response)
        
        if (response && response.houses && Array.isArray(response.houses)) {
          setHouses(response.houses)
        } else {
          console.error("Unexpected houses response format:", response)
          setHouses([])
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching houses:", error)
        setError(error instanceof Error ? error.message : String(error))
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: "Failed to load houses",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouses()
  }, [toast, t])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("common.houses")}</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/houses/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.createHouse")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/houses/join">{t("dashboard.joinHouse")}</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-red-500">
            <p>Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40" />
            </Card>
          ))}
        </div>
      ) : houses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((house) => (
            <HouseCard 
              key={house.id} 
              house={{
                id: house.id,
                name: house.house_name || house.name || "Unnamed House",
                description: house.description || "",
                memberCount: house.members?.length || house.memberCount || 0
              }} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("dashboard.noHouses")}</p>
            <Button asChild>
              <Link href="/dashboard/houses/create">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.createHouse")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

