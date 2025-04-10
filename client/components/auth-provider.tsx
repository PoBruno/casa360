"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { authApi, checkApiConnection } from "@/lib/api"

type User = {
  id: string
  name: string
  email: string
  avatar?: string
  points: number
  level: number
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkApiConnection: () => Promise<boolean>
  isOfflineMode: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  checkApiConnection: async () => false,
  isOfflineMode: false,
})

const publicRoutes = ["/", "/login", "/signup", "/debug"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Log da URL de backend e checagem da API no startup
  useEffect(() => {
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL)
    checkApiConnection().then((isConnected) => {
      if (!isConnected) {
        console.warn("API server is not reachable. Some features may not work.")
        setIsOfflineMode(true)
      } else {
        setIsOfflineMode(false)
      }
    })
  }, [])

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      if (typeof window === "undefined") return

      try {
        const token = localStorage.getItem("casa360_token")

        if (!token) {
          setIsLoading(false)
          if (!publicRoutes.includes(pathname)) {
            router.push("/login")
          }
          return
        }

        // Check if API is reachable before making the request
        const isConnected = await checkApiConnection()
        if (!isConnected) {
          console.warn("API server is not reachable. Using cached user data if available.")
          setIsOfflineMode(true)

          // Try to use cached user data if available
          const cachedUser = localStorage.getItem("casa360_user")
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
            } catch (e) {
              console.error("Failed to parse cached user data:", e)
            }
          }
          setIsLoading(false)
          return
        }

        setIsOfflineMode(false)

        try {
          // Usar a API centralizada em vez de fetch direto
          const userData = await authApi.me()
          setUser(userData)
          // Cache user data for offline use
          localStorage.setItem("casa360_user", JSON.stringify(userData))
        } catch (error) {
          console.error("Error fetching user data:", error)
          
          // Limpar tokens se for erro de autenticação
          localStorage.removeItem("casa360_token")
          localStorage.removeItem("casa360_user")
          
          if (!publicRoutes.includes(pathname)) {
            router.push("/login")
          }
          
          // Se não pudermos buscar os dados do usuário mas tivermos dados em cache, use-os
          const cachedUser = localStorage.getItem("casa360_user")
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
              setIsOfflineMode(true)
            } catch (e) {
              console.error("Failed to parse cached user data:", e)
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Check if API is reachable
      const isConnected = await checkApiConnection()
      if (!isConnected) {
        setIsOfflineMode(true)
        throw new Error("Cannot connect to the server. Please check your internet connection and try again.")
      }

      setIsOfflineMode(false)
      
      // Usar a API centralizada em vez de fetch direto
      const data = await authApi.login(email, password)
      
      localStorage.setItem("casa360_token", data.token)
      localStorage.setItem("casa360_user", JSON.stringify(data.user))
      
      // Transformar os dados do usuário para o formato esperado
      const userData: User = {
        id: data.user.id,
        name: data.user.full_name || data.user.username,
        email: data.user.email,
        points: data.user.points || 0,
        level: data.user.level || 1,
      }
      
      setUser(userData)
      router.push("/dashboard")
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      })
    } catch (error) {
      console.error("Login error:", error)
      
      // Provide more specific error messages
      let errorMessage = typeof error === 'string' ? error : "An unknown error occurred"
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      })

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Check if API is reachable
      const isConnected = await checkApiConnection()
      if (!isConnected) {
        setIsOfflineMode(true)
        throw new Error("Cannot connect to the server. Please check your internet connection and try again.")
      }

      setIsOfflineMode(false)
      
      // Usar a API centralizada em vez de fetch direto
      const data = await authApi.register(name, email, password)
      
      localStorage.setItem("casa360_token", data.token)
      localStorage.setItem("casa360_user", JSON.stringify(data.user))
      
      // Transformar os dados do usuário para o formato esperado
      const userData: User = {
        id: data.user.id,
        name: data.user.full_name || data.user.username,
        email: data.user.email,
        points: data.user.points || 0,
        level: data.user.level || 1,
      }
      
      setUser(userData)
      router.push("/dashboard")
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      })
    } catch (error) {
      console.error("Signup error:", error)
      
      // Provide more specific error messages
      let errorMessage = typeof error === 'string' ? error : "An unknown error occurred"
      
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: errorMessage,
      })

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("casa360_token")
      localStorage.removeItem("casa360_user")
    }
    setUser(null)
    router.push("/")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        checkApiConnection,
        isOfflineMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}

