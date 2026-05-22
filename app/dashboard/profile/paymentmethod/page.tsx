"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Banknote,
  Smartphone,
  Trash2,
  Check,
  Plus,
  X,
  Upload,
  QrCode,
  Info,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface PaymentMethod {
  _id: string
  type: "upi" | "bank"
  label: string
  details: Record<string, string>
  isDefault: boolean
}

export default function ReceivingDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const qrFileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addType, setAddType] = useState<"upi" | "bank">("upi")
  const [adding, setAdding] = useState(false)

  // UPI fields
  const [upiId, setUpiId] = useState("")
  const [qrImageUrl, setQrImageUrl] = useState("")
  const [uploadingQR, setUploadingQR] = useState(false)
  const [upiLabel, setUpiLabel] = useState("")

  // Bank fields
  const [bankLabel, setBankLabel] = useState("")
  const [accountHolder, setAccountHolder] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [ifsc, setIfsc] = useState("")
  const [bankName, setBankName] = useState("")

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
      const res = await fetch(`/api/payment-methods?userId=${uid}`)
      const data = await res.json()
      if (res.ok) setMethods(data.methods || [])
    } catch {
      console.error("Failed to fetch methods")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMethods((prev) => prev.filter((m) => m._id !== id))
        toast({ title: "Removed", description: "Receiving detail deleted." })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (res.ok) {
        setMethods((prev) =>
          prev
            .map((m) => ({ ...m, isDefault: m._id === id }))
            .sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0))
        )
        toast({ title: "Updated", description: "Default receiving method updated." })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  // Upload QR code image
  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" })
      return
    }
    setUploadingQR(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (res.ok) {
        setQrImageUrl(data.fileUrl)
        toast({ title: "QR Uploaded", description: "Your QR code image has been uploaded." })
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" })
    } finally {
      setUploadingQR(false)
      if (qrFileRef.current) qrFileRef.current.value = ""
    }
  }

  const isUpiValid = () => {
    if (!upiLabel.trim()) return false
    const parts = upiId.split("@")
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0
  }

  const isBankValid = () => {
    if (!bankLabel.trim()) return false
    if (accountHolder.trim().length < 2) return false
    if (accountNumber.trim().length < 9) return false
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return false
    if (!bankName.trim()) return false
    return true
  }

  const resetForm = () => {
    setUpiId("")
    setQrImageUrl("")
    setUpiLabel("")
    setBankLabel("")
    setAccountHolder("")
    setAccountNumber("")
    setIfsc("")
    setBankName("")
    setShowAddForm(false)
  }

  const handleAdd = async () => {
    if (!firebaseUser) return
    const isValid = addType === "upi" ? isUpiValid() : isBankValid()
    if (!isValid) {
      toast({ title: "Validation Error", description: "Please fill in all required fields correctly.", variant: "destructive" })
      return
    }

    setAdding(true)
    try {
      const details: Record<string, string> = addType === "upi"
        ? { upiId, ...(qrImageUrl ? { qrImageUrl } : {}) }
        : { accountHolder, accountNumber, ifsc, bankName }

      const label = addType === "upi" ? upiLabel : bankLabel

      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: firebaseUser.uid,
          type: addType,
          label,
          details,
          isDefault: methods.length === 0,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMethods((prev) => [data.method, ...prev])
        resetForm()
        toast({ title: "Saved", description: "Receiving detail added successfully." })
      } else {
        const data = await res.json()
        toast({ title: "Error", description: data.error || "Failed to add.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Receiving Details</h1>
          <p className="text-sm text-muted-foreground">How borrowers will send repayments to you</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-5 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-600 dark:text-blue-400">
          <p className="font-semibold mb-0.5">These details are shown to your borrowers</p>
          <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/80">
            When a borrower needs to repay you, they will see your UPI ID, QR code, or bank account details so they can send the exact amount directly to you. The platform doesn&apos;t handle any money.
          </p>
        </div>
      </div>

      {/* Saved Methods */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Saved Receiving Methods</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {methods.length === 0 ? "No methods added yet" : `${methods.length} method${methods.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>
        </div>

        {methods.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No receiving details yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your UPI or bank details so borrowers can pay you</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {methods.map((method) => {
              const isUpi = method.type === "upi"
              const Icon = isUpi ? Smartphone : Banknote
              const colorClass = isUpi
                ? "text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400"
                : "text-blue-600 bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"

              return (
                <div key={method._id} className="group hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 px-6 py-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{method.label}</p>
                        <span className="text-[10px] font-bold uppercase bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          {isUpi ? "UPI" : "Bank"}
                        </span>
                        {method.isDefault && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary font-bold">
                            <Star className="h-2.5 w-2.5 fill-primary" /> Default
                          </span>
                        )}
                      </div>
                      {/* Preview line */}
                      {isUpi ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{method.details.upiId}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {method.details.bankName} &bull; ••••{method.details.accountNumber?.slice(-4)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!method.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(method._id)}
                          className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline px-2"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(method._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* QR preview for UPI methods that have one */}
                  {isUpi && method.details.qrImageUrl && (
                    <div className="px-6 pb-4 flex items-center gap-3">
                      <div className="bg-white rounded-lg border border-border/60 p-1.5 shadow-sm">
                        <img
                          src={method.details.qrImageUrl}
                          alt="Payment QR Code"
                          className="h-16 w-16 object-contain rounded"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-0.5">QR Code uploaded</p>
                        <p>Borrowers can scan this to pay you directly</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add New Method Form */}
      {showAddForm ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Add Receiving Detail</h3>
            <button
              type="button"
              onClick={resetForm}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Type selector */}
          <div>
            <Label className="mb-2 block text-sm">Method Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["upi", "bank"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAddType(t)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                    addType === t
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-secondary/40"
                  }`}
                >
                  {t === "upi" ? (
                    <Smartphone className={`h-5 w-5 ${addType === t ? "text-primary" : "text-muted-foreground"}`} />
                  ) : (
                    <Banknote className={`h-5 w-5 ${addType === t ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${addType === t ? "text-primary" : "text-foreground"}`}>
                      {t === "upi" ? "UPI" : "Bank Account"}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {t === "upi" ? "GPay, PhonePe, Paytm etc." : "NEFT / IMPS transfer"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* UPI Fields */}
          {addType === "upi" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="upiLabel">Label (e.g. &quot;My GPay&quot;)</Label>
                <Input
                  id="upiLabel"
                  placeholder="Personal UPI"
                  value={upiLabel}
                  onChange={(e) => setUpiLabel(e.target.value)}
                  className="h-11 bg-input border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upiId">UPI ID (VPA)</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.trim())}
                  className="h-11 bg-input border-border font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This is the address borrowers will manually type or copy to pay you
                </p>
              </div>

              {/* QR Code Upload */}
              <div className="space-y-2">
                <Label>QR Code Image (Optional but Recommended)</Label>
                <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-5">
                  {qrImageUrl ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-white rounded-lg border border-border p-2 shadow-sm shrink-0">
                        <img src={qrImageUrl} alt="QR Preview" className="h-20 w-20 object-contain rounded" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          <Check className="inline h-3.5 w-3.5 mr-1" />
                          QR Code uploaded
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Borrowers can scan this with GPay / PhonePe / any UPI app
                        </p>
                        <button
                          type="button"
                          onClick={() => setQrImageUrl("")}
                          className="text-xs text-destructive hover:underline mt-2"
                        >
                          Remove QR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium mb-0.5">Upload your UPI QR Code</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Export your QR from GPay / PhonePe / Paytm and upload it here
                      </p>
                      <input
                        ref={qrFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQRUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => qrFileRef.current?.click()}
                        disabled={uploadingQR}
                        className="h-9 text-xs"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {uploadingQR ? "Uploading..." : "Choose QR Image"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bank Fields */}
          {addType === "bank" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankLabel">Label (e.g. &quot;Salary Account&quot;)</Label>
                <Input
                  id="bankLabel"
                  placeholder="My HDFC Account"
                  value={bankLabel}
                  onChange={(e) => setBankLabel(e.target.value)}
                  className="h-11 bg-input border-border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-11 bg-input border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accHolder">Account Holder Name</Label>
                  <Input
                    id="accHolder"
                    placeholder="As per bank records"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="h-11 bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accNumber">Account Number</Label>
                <Input
                  id="accNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className="h-11 bg-input border-border font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  className="h-11 bg-input border-border font-mono uppercase"
                  maxLength={11}
                />
                {ifsc.length > 4 && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) && (
                  <p className="text-xs text-orange-500">IFSC format: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-11" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleAdd}
              disabled={adding || (addType === "upi" ? !isUpiValid() : !isBankValid())}
            >
              {adding ? "Saving..." : "Save Receiving Detail"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full h-14 bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Receiving Detail
        </Button>
      )}
    </div>
  )
}
