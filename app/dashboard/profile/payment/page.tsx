"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard, Plus, Banknote, Smartphone, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface PaymentMethod {
  _id: string
  type: "upi" | "bank" | "card"
  label: string
  details: Record<string, string>
  isDefault: boolean
}

export default function PaymentMethodsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addType, setAddType] = useState<"upi" | "bank" | "card">("upi")
  const [addLabel, setAddLabel] = useState("")
  const [addDetails, setAddDetails] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user)
        await fetchMethods(user.uid)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchMethods = async (uid: string) => {
    try {
      const response = await fetch(`/api/payment-methods?userId=${uid}`)
      const data = await response.json()
      if (response.ok) {
        setMethods(data.methods || [])
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" })
      if (response.ok) {
        setMethods((prev) => prev.filter((m) => m._id !== id))
        toast({ title: "Deleted", description: "Payment method removed." })
      } else {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  const handleAdd = async () => {
    if (!firebaseUser || !addLabel) return
    setAdding(true)
    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          type: addType,
          label: addLabel,
          details: addDetails,
          isDefault: methods.length === 0,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setMethods((prev) => [data.method, ...prev])
        setShowAddForm(false)
        setAddLabel("")
        setAddDetails({})
        toast({ title: "Added", description: "Payment method added." })
      } else {
        const data = await response.json()
        toast({ title: "Error", description: data.error || "Failed to add.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "upi": return Smartphone
      case "bank": return Banknote
      case "card": return CreditCard
      default: return CreditCard
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case "upi": return "text-green-500 bg-green-500/10"
      case "bank": return "text-blue-500 bg-blue-500/10"
      case "card": return "text-purple-500 bg-purple-500/10"
      default: return "text-muted-foreground bg-secondary"
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
          <h1 className="text-xl font-bold">Payment Methods</h1>
          <p className="text-sm text-muted-foreground">Manage your linked accounts</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {methods.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payment methods linked yet</p>
          </div>
        ) : (
          methods.map((method) => {
            const Icon = typeIcon(method.type)
            const colorClass = typeColor(method.type)
            return (
              <div
                key={method._id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">{method.label}</p>
                        {method.isDefault && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Check className="h-3 w-3" /> Default
                          </span>
                        )}
                      </div>
                      {Object.entries(method.details).map(([key, val]) => (
                        <p key={key} className="text-sm text-muted-foreground">
                          {key}: {val}
                        </p>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(method._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAddForm ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Add Payment Method</h3>

          <div className="flex gap-2">
            {(["upi", "bank", "card"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={addType === t ? "default" : "outline"}
                size="sm"
                onClick={() => { setAddType(t); setAddDetails({}) }}
                className="capitalize"
              >
                {t === "upi" ? "UPI" : t === "bank" ? "Bank" : "Card"}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder={addType === "upi" ? "My UPI" : addType === "bank" ? "My Bank Account" : "My Card"}
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              className="h-12 bg-input border-border"
            />
          </div>

          {addType === "upi" && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="example@paytm"
                value={addDetails.upiId || ""}
                onChange={(e) => setAddDetails({ upiId: e.target.value })}
                className="h-12 bg-input border-border"
              />
            </div>
          )}

          {addType === "bank" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accName">Account Holder Name</Label>
                <Input
                  id="accName"
                  placeholder="John Doe"
                  value={addDetails.accountHolder || ""}
                  onChange={(e) => setAddDetails((prev) => ({ ...prev, accountHolder: e.target.value }))}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accNumber">Account Number</Label>
                <Input
                  id="accNumber"
                  placeholder="XXXXXXXXXXXX"
                  value={addDetails.accountNumber || ""}
                  onChange={(e) => setAddDetails((prev) => ({ ...prev, accountNumber: e.target.value }))}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input
                  id="ifsc"
                  placeholder="SBIN0001234"
                  value={addDetails.ifsc || ""}
                  onChange={(e) => setAddDetails((prev) => ({ ...prev, ifsc: e.target.value.toUpperCase() }))}
                  className="h-12 bg-input border-border font-mono uppercase"
                />
              </div>
            </>
          )}

          {addType === "card" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="XXXX XXXX XXXX XXXX"
                  value={addDetails.cardNumber || ""}
                  onChange={(e) => setAddDetails((prev) => ({ ...prev, cardNumber: e.target.value }))}
                  className="h-12 bg-input border-border font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={addDetails.expiry || ""}
                    onChange={(e) => setAddDetails((prev) => ({ ...prev, expiry: e.target.value }))}
                    className="h-12 bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNetwork">Network</Label>
                  <Input
                    id="cardNetwork"
                    placeholder="Visa / Mastercard"
                    value={addDetails.cardNetwork || ""}
                    onChange={(e) => setAddDetails((prev) => ({ ...prev, cardNetwork: e.target.value }))}
                    className="h-12 bg-input border-border"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12" onClick={handleAdd} disabled={adding || !addLabel}>
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full h-14 bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Payment Method
        </Button>
      )}
    </div>
  )
}
