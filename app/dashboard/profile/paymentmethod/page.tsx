"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard, Plus, Banknote, Smartphone, Trash2, Check, ChevronRight, X } from "lucide-react"
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
        toast({ title: "Removed", description: "Payment method deleted." })
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
        toast({ title: "Added", description: "Payment method added successfully." })
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
      case "upi": return "text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400"
      case "bank": return "text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
      case "card": return "text-purple-600 bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400"
      default: return "text-muted-foreground bg-secondary"
    }
  }

  const typeBadge = (type: string) => {
    switch (type) {
      case "upi": return "UPI"
      case "bank": return "Bank"
      case "card": return "Card"
      default: return type
    }
  }

  const detailPreview = (method: PaymentMethod) => {
    if (method.type === "upi") return method.details.upiId || ""
    if (method.type === "bank") return `••••${method.details.accountNumber?.slice(-4) || ""}`
    if (method.type === "card") return `•••• ${method.details.cardNumber?.slice(-4) || ""}`
    return ""
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

      {/* Saved Methods */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Saved Accounts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{methods.length} method{methods.length !== 1 ? "s" : ""} linked</p>
        </div>

        {methods.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payment methods linked yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add a method to start making payments</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {methods.map((method) => {
              const Icon = typeIcon(method.type)
              const colorClass = typeColor(method.type)
              return (
                <div key={method._id} className="flex items-center gap-3 px-6 py-4 hover:bg-secondary/30 transition-colors group">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{method.label}</p>
                      <span className="text-[10px] font-medium uppercase text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{typeBadge(method.type)}</span>
                      {method.isDefault && (
                        <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                          <Check className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                    </div>
                    {detailPreview(method) && (
                      <p className="text-xs text-muted-foreground truncate">{detailPreview(method)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(method._id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add New Method */}
      {showAddForm ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Add New Method</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <Label className="mb-2 block text-sm">Payment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["upi", "bank", "card"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setAddType(t); setAddDetails({}) }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${addType === t
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-secondary/50"
                    }`}
                >
                  {t === "upi" ? <Smartphone className={`h-5 w-5 ${addType === t ? "text-primary" : "text-muted-foreground"}`} />
                    : t === "bank" ? <Banknote className={`h-5 w-5 ${addType === t ? "text-primary" : "text-muted-foreground"}`} />
                      : <CreditCard className={`h-5 w-5 ${addType === t ? "text-primary" : "text-muted-foreground"}`} />}
                  <span className={`text-xs font-medium ${addType === t ? "text-primary" : "text-muted-foreground"}`}>
                    {t === "upi" ? "UPI" : t === "bank" ? "Bank" : "Card"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder={addType === "upi" ? "e.g. Personal UPI" : addType === "bank" ? "e.g. Salary Account" : "e.g. My Credit Card"}
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
              <p className="text-xs text-muted-foreground">Your UPI VPA address for receiving payments</p>
            </div>
          )}

          {addType === "bank" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accName">Account Holder Name</Label>
                <Input
                  id="accName"
                  placeholder="As per bank records"
                  value={addDetails.accountHolder || ""}
                  onChange={(e) => setAddDetails((prev) => ({ ...prev, accountHolder: e.target.value }))}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accNumber">Account Number</Label>
                <Input
                  id="accNumber"
                  placeholder="Enter account number"
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
                  maxLength={19}
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
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNetwork">Network</Label>
                  <Input
                    id="cardNetwork"
                    placeholder="Visa / Mastercard / RuPay"
                    value={addDetails.cardNetwork || ""}
                    onChange={(e) => setAddDetails((prev) => ({ ...prev, cardNetwork: e.target.value }))}
                    className="h-12 bg-input border-border"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAdd} disabled={adding || !addLabel}>
              {adding ? "Adding..." : "Save Method"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full h-14 bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Payment Method
        </Button>
      )}
    </div>
  )
}
