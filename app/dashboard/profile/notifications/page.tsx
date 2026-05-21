"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bell, BellRing, MessageSquare, BadgeDollarSign, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface Preference {
  id: string
  label: string
  description: string
  icon: any
  enabled: boolean
}

const DEFAULT_PREFERENCES: Preference[] = [
  { id: "push", label: "Push Notifications", description: "Receive notifications on your device", icon: Bell, enabled: true },
  { id: "email", label: "Email Notifications", description: "Receive notifications via email", icon: BellRing, enabled: true },
  { id: "payment_reminders", label: "Payment Reminders", description: "Get reminded before payment due dates", icon: BadgeDollarSign, enabled: true },
  { id: "ai_calls", label: "AI Call Notifications", description: "Get notified when AI calls are available", icon: Sparkles, enabled: true },
  { id: "group_activity", label: "Group Activity", description: "Updates from your groups", icon: Users, enabled: true },
  { id: "messages", label: "Messages", description: "New messages from agreements", icon: MessageSquare, enabled: true },
]

export default function NotificationPreferencesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [preferences, setPreferences] = useState<Preference[]>(DEFAULT_PREFERENCES)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user)
        await fetchPreferences(user.uid)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchPreferences = async (uid: string) => {
    try {
      const response = await fetch(`/api/users/${uid}`)
      const data = await response.json()
      if (response.ok && data.user?.notificationPreferences) {
        const saved = data.user.notificationPreferences
        setPreferences((prev) =>
          prev.map((p) => ({
            ...p,
            enabled: saved[p.id] !== undefined ? saved[p.id] : p.enabled,
          }))
        )
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const handleSave = async () => {
    if (!firebaseUser) return
    setSaving(true)
    try {
      const prefsMap: Record<string, boolean> = {}
      preferences.forEach((p) => { prefsMap[p.id] = p.enabled })

      const response = await fetch(`/api/users/${firebaseUser.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: prefsMap }),
      })

      if (response.ok) {
        toast({ title: "Saved", description: "Notification preferences updated." })
      } else {
        const data = await response.json()
        toast({ title: "Error", description: data.error || "Failed to save.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-xl font-bold">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground">Control how you receive alerts</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-1 mb-6">
          <h2 className="font-semibold">Notification Types</h2>
          <p className="text-sm text-muted-foreground">Toggle which notifications you want to receive</p>
        </div>

        <div className="space-y-3">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <pref.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              <Switch
                checked={pref.enabled}
                onCheckedChange={() => togglePreference(pref.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  )
}
