"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Banknote,
  Smartphone,
  Copy,
  Check,
  QrCode,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
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

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const { toast } = useToast()
  const proofFileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [agreement, setAgreement] = useState<any>(null)
  const [lenderMethods, setLenderMethods] = useState<PaymentMethod[]>([])

  // Which method the borrower chose to view/use
  const [selectedMethod, setSelectedMethod] = useState<string>("") // method _id

  // Proof upload
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>("")
  const [utrNumber, setUtrNumber] = useState("")
  const [uploadingProof, setUploadingProof] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitDone, setSubmitDone] = useState(false)

  // Copy UPI ID feedback
  const [copiedUpiId, setCopiedUpiId] = useState("")

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchData(user.uid)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router, id])

  const fetchData = async (uid: string) => {
    try {
      setLoading(true)
      // 1. Fetch agreement
      const aggRes = await fetch(`/api/agreements/${id}`)
      const aggData = await aggRes.json()
      if (!aggRes.ok) {
        toast({ title: "Error", description: "Agreement not found.", variant: "destructive" })
        router.push("/dashboard")
        return
      }
      const agg = aggData.agreement
      setAgreement(agg)

      // 2. Fetch lender's receiving methods
      const lenderRes = await fetch(`/api/payment-methods?userId=${agg.lenderId}`)
      const lenderData = await lenderRes.json()
      if (lenderRes.ok) {
        const methods: PaymentMethod[] = lenderData.methods || []
        setLenderMethods(methods)
        // Pre-select default or first
        const def = methods.find((m) => m.isDefault) || methods[0]
        if (def) setSelectedMethod(def._id)
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUpiId = (upiId: string) => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopiedUpiId(upiId)
      toast({ title: "Copied", description: "UPI ID copied to clipboard." })
      setTimeout(() => setCopiedUpiId(""), 2000)
    })
  }

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload an image or PDF.", variant: "destructive" })
      return
    }
    setProofFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setProofPreviewUrl(url)
    } else {
      setProofPreviewUrl("")
    }
  }

  const handleRemoveProof = () => {
    setProofFile(null)
    setProofPreviewUrl("")
    if (proofFileRef.current) proofFileRef.current.value = ""
  }

  const handleSubmitProof = async () => {
    if (!proofFile) {
      toast({ title: "Upload Required", description: "Please upload a screenshot of your payment.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload proof image
      const formData = new FormData()
      formData.append("file", proofFile)
      setUploadingProof(true)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()
      setUploadingProof(false)

      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

      // 2. Determine which method was used
      const chosenMethod = lenderMethods.find((m) => m._id === selectedMethod)
      const methodLabel = chosenMethod
        ? `${chosenMethod.type.toUpperCase()} — ${chosenMethod.label}`
        : "Payment Method"

      const utrNote = utrNumber.trim() ? ` (UTR/Ref: ${utrNumber.trim()})` : ""

      // 3. PATCH agreement: status → reviewing, save borrowerProof, update timeline
      const patchRes = await fetch(`/api/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "reviewing",
          borrowerProof: {
            fileName: proofFile.name,
            fileUrl: uploadData.fileUrl,
            uploadedAt: new Date().toISOString(),
          },
          timeline: [
            ...agreement.timeline,
            {
              event: `Payment proof submitted via ${methodLabel}${utrNote}`,
              date: new Date().toISOString(),
              completed: true,
            },
          ],
        }),
      })

      if (!patchRes.ok) throw new Error("Failed to update agreement")

      setSubmitDone(true)
      toast({
        title: "Proof Submitted!",
        description: `Waiting for ${agreement.lenderName} to confirm receipt.`,
      })

      setTimeout(() => router.push(`/dashboard/agreement/${id}`), 2000)
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
      setUploadingProof(false)
    }
  }

  if (loading || !agreement) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    )
  }

  const chosenMethod = lenderMethods.find((m) => m._id === selectedMethod)

  return (
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/dashboard/agreement/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pay & Close</h1>
          <p className="text-sm text-muted-foreground">Repayment to {agreement.lenderName}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Exact Amount to Pay</p>
          <p className="text-3xl font-extrabold text-primary mt-1">₹{agreement.amount.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {agreement.purpose ? `For: ${agreement.purpose}` : `Agreement with ${agreement.lenderName}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Due</p>
          <p className="text-sm font-semibold">
            {new Date(agreement.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* How to pay section */}
      {lenderMethods.length === 0 ? (
        /* Lender hasn't set up receiving details yet */
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
            {agreement.lenderName} hasn&apos;t set up receiving details yet
          </h3>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
            Ask {agreement.lenderName} to add their UPI ID or bank account in their profile so you know where to send the payment.
          </p>
        </div>
      ) : (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              {agreement.lenderName}&apos;s Payment Details
            </h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            Choose how to pay, then open your payment app and send ₹{agreement.amount.toLocaleString("en-IN")} to the details below.
          </p>

          {/* Method selection tabs */}
          <div className="flex gap-2 flex-wrap">
            {lenderMethods.map((m) => {
              const Icon = m.type === "upi" ? Smartphone : Banknote
              const isActive = selectedMethod === m._id
              return (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setSelectedMethod(m._id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Method detail card */}
          {chosenMethod && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {chosenMethod.type === "upi" && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500 shrink-0">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">UPI Payment</p>
                      <p className="font-semibold text-sm">{chosenMethod.label}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold uppercase bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                      UPI
                    </span>
                  </div>

                  {/* UPI ID with copy */}
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      UPI ID (VPA)
                    </Label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                      <span className="flex-1 font-mono text-sm font-semibold">{chosenMethod.details.upiId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyUpiId(chosenMethod.details.upiId)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
                      >
                        {copiedUpiId === chosenMethod.details.upiId ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedUpiId === chosenMethod.details.upiId ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Open GPay / PhonePe / Paytm → Send Money → Enter this UPI ID → Pay ₹{agreement.amount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* QR Code — only shown if lender uploaded one */}
                  {chosenMethod.details.qrImageUrl ? (
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Scan QR Code
                      </Label>
                      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-4 shadow-sm">
                        <img
                          src={chosenMethod.details.qrImageUrl}
                          alt="UPI QR Code"
                          className="h-44 w-44 object-contain"
                        />
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-3">
                          Scan with any UPI app to pay
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 border border-border/60 p-3">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        {agreement.lenderName} hasn&apos;t uploaded a QR code. Use the UPI ID above to pay manually.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {chosenMethod.type === "bank" && (
                <div className="p-5">
                  <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bank Transfer</p>
                      <p className="font-semibold text-sm">{chosenMethod.label}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      NEFT/IMPS
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: "Account Holder Name", value: chosenMethod.details.accountHolder },
                      { label: "Bank Name", value: chosenMethod.details.bankName },
                      { label: "Account Number", value: chosenMethod.details.accountNumber, mono: true },
                      { label: "IFSC Code", value: chosenMethod.details.ifsc, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground shrink-0 w-36">{label}</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className={`text-sm font-semibold text-right ${mono ? "font-mono" : ""}`}>{value}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(value || "")
                              toast({ title: "Copied", description: `${label} copied.` })
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-secondary/40 border border-border/60 p-3 flex gap-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Transfer exactly ₹{agreement.amount.toLocaleString("en-IN")} via NEFT / IMPS / UPI to the above account. Save the UTR number after transfer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Proof Upload Section */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Upload Payment Proof</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            After you pay, come back here and upload your payment screenshot so {agreement.lenderName} can verify it.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* File drop zone */}
          {!proofFile ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 p-8 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => proofFileRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-0.5">Upload payment screenshot</p>
              <p className="text-xs text-muted-foreground">Click to choose — image or PDF</p>
              <input
                ref={proofFileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleProofFileChange}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <div className="flex items-center gap-3">
                {proofPreviewUrl ? (
                  <img src={proofPreviewUrl} alt="Proof preview" className="h-16 w-16 object-cover rounded-lg border border-border shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
                    <QrCode className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> File ready
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{proofFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(proofFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveProof}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* UTR / Reference number */}
          <div className="space-y-1.5">
            <Label htmlFor="utrInput" className="text-xs font-semibold text-muted-foreground">
              UTR / Transaction Reference Number (Optional)
            </Label>
            <Input
              id="utrInput"
              placeholder="e.g. 426789123456"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ""))}
              className="h-11 bg-input border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This helps {agreement.lenderName} match the transfer in their statement
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      {submitDone ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
          <h3 className="font-bold text-green-700 dark:text-green-400 mb-1">Proof Submitted!</h3>
          <p className="text-sm text-muted-foreground">
            Waiting for {agreement.lenderName} to confirm receipt. You&apos;ll be redirected shortly.
          </p>
        </div>
      ) : (
        <Button
          onClick={handleSubmitProof}
          disabled={isSubmitting || !proofFile}
          className="w-full h-14 bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {uploadingProof ? "Uploading screenshot..." : "Submitting proof..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              I&apos;ve Paid — Submit Proof
            </span>
          )}
        </Button>
      )}

      <p className="text-xs text-center text-muted-foreground mt-4 leading-relaxed">
        After you submit, {agreement.lenderName} will be notified to verify the payment and confirm receipt to close the agreement.
      </p>
    </div>
  )
}
