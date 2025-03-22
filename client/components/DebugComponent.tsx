'use client'

import { DebugApi } from "@/components/debug-api"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function DebugComponent() {
  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Debug Tools</h1>
      </div>
      
      <DebugApi />
    </div>
  )
}