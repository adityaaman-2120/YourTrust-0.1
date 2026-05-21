"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shield, Key, Smartphone, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function SecurityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        setLoading(false)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

  const providers = currentUser?.providerData?.map((p: any) => p.providerId) || []
  const isGoogleAuth = providers.includes("google.com")
  const isEmailAuth = providers.includes("password")

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Security</h1>
          <p className="text-sm text-muted-foreground">Password and authentication</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Authentication Methods */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Authentication Methods</h2>
              <p className="text-sm text-muted-foreground">How you sign in to YourTrust</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">G</div>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  <p className="text-xs text-muted-foreground">{isGoogleAuth ? "Connected" : "Not connected"}</p>
                </div>
              </div>
              <Badge variant={isGoogleAuth ? "default" : "outline"}>{isGoogleAuth ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">E</div>
                <div>
                  <p className="text-sm font-medium">Email & Password</p>
                  <p className="text-xs text-muted-foreground">{isEmailAuth ? "Enabled" : "Not set up"}</p>
                </div>
              </div>
              <Badge variant={isEmailAuth ? "default" : "outline"}>{isEmailAuth ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Two-factor authentication adds an additional step to your sign-in process, helping to keep your account more secure.
          </p>
          <Button variant="outline" disabled className="w-full">
            Coming Soon
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/10 text-chart-3">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Recent Login Activity</h2>
              <p className="text-sm text-muted-foreground">Your account sign-in history</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-4 text-center text-sm text-muted-foreground">
            {currentUser?.metadata?.lastSignInTime
              ? `Last signed in: ${new Date(currentUser.metadata.lastSignInTime).toLocaleString("en-IN")}`
              : "No recent activity"}
          </div>
        </div>
      </div>
    </div>
  )
}
