"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Mail, Phone, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        await fetchUserData(user.uid)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchUserData = async (uid: string) => {
    try {
      const response = await fetch(`/api/users/${uid}`)
      const data = await response.json()
      if (response.ok) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${currentUser.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Saved", description: "Account settings updated successfully." })
      } else {
        toast({ title: "Error", description: data.error || "Failed to save.", variant: "destructive" })
      }
    } catch (error) {
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
          <h1 className="text-xl font-bold">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Update your personal information</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="h-12 pl-10 bg-input border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="h-12 pl-10 bg-muted border-border text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support for assistance.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              name="phone"
              placeholder="+91XXXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              className="h-12 pl-10 bg-input border-border"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
        >
          <Save className="mr-2 h-5 w-5" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
