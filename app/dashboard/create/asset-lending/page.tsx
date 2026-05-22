"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Upload,
  Check,
  Info,
  User,
  Phone,
  Calendar,
  BadgeDollarSign,
  Package,
  X,
  Image,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { RecentFriendsModal } from "@/components/dashboard/RecentFriendsModal"

const steps = [
  { id: 1, title: "Asset Details", icon: Package },
  { id: 2, title: "Buffer Days", icon: Calendar },
  { id: 3, title: "Add Witness", icon: User },
  { id: 4, title: "Upload Photos", icon: Image },
]

const categories = [
  "Electronics",
  "Vehicles",
  "Furniture",
  "Tools & Equipment",
  "Books & Media",
  "Sports & Outdoors",
  "Clothing & Accessories",
  "Home & Garden",
  "Musical Instruments",
  "Cameras & Optics",
  "Party & Events",
  "Other",
]

const conditions = ["Excellent", "Good", "Fair", "Poor"]

export default function AssetLendingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerEmail: "",
    borrowerPhone: "",
    assetName: "",
    assetCategory: "",
    estimatedValue: "",
    returnDate: "",
    condition: "",
    instructions: "",
    bufferDays: 3,
    witnessName: "",
    witnessEmail: "",
    witnessPhone: "",
    photos: [] as File[],
    photoUrls: [] as string[],
  })

  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      bufferDays: value[0],
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    setUploadingPhotos(true)

    const newUrls: string[] = []
    for (const file of files) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, file],
      }))
      newUrls.push(URL.createObjectURL(file))
    }

    setFormData((prev) => ({
      ...prev,
      photoUrls: [...prev.photoUrls, ...newUrls],
    }))
    setUploadingPhotos(false)
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Please sign in to create an agreement")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photos first
      const uploadedPhotos: { fileName: string; fileUrl: string }[] = []
      for (const photo of formData.photos) {
        const photoData = new FormData()
        photoData.append("file", photo)
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: photoData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadedPhotos.push({
            fileName: uploadData.fileName,
            fileUrl: uploadData.fileUrl,
          })
        }
      }

      const agreementData = {
        lenderId: currentUser.uid,
        lenderName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        lenderEmail: currentUser.email,
        borrowerName: formData.borrowerName,
        borrowerEmail: formData.borrowerEmail,
        borrowerPhone: formData.borrowerPhone,
        dealType: "asset",
        amount: parseFloat(formData.estimatedValue) || 0,
        estimatedValue: parseFloat(formData.estimatedValue) || 0,
        assetName: formData.assetName,
        assetCategory: formData.assetCategory,
        assetCondition: formData.condition,
        instructions: formData.instructions,
        dueDate: formData.returnDate,
        bufferDays: formData.bufferDays,
        witnessName: formData.witnessName,
        witnessEmail: formData.witnessEmail,
        witnessPhone: formData.witnessPhone,
        assetPhotos: uploadedPhotos,
        proofFile: uploadedPhotos.length > 0 ? uploadedPhotos[0] : undefined,
      }

      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agreementData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/dashboard")
      } else {
        if (data.message) {
          alert(data.message)
        } else {
          alert(`Failed to create agreement: ${data.error}`)
        }
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error creating agreement:", error)
      alert("Failed to create agreement. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.borrowerName &&
          formData.borrowerEmail &&
          formData.assetName &&
          formData.assetCategory &&
          formData.estimatedValue &&
          formData.returnDate &&
          formData.condition
        )
      case 2:
        return true
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/create"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Asset Lending</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of 4
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-card text-muted-foreground"
                    }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                    }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-16 lg:w-24 transition-colors ${currentStep > step.id ? "bg-primary" : "bg-border"
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {/* Step 1: Asset Details */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="borrowerName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Borrower Name
              </Label>
              <div className="flex justify-end mb-1">
                {currentUser && (
                  <RecentFriendsModal
                    userId={currentUser.uid}
                    userEmail={currentUser.email}
                    onSelectFriend={(friend) => {
                      setFormData((prev) => ({
                        ...prev,
                        borrowerName: friend.borrowerName,
                        borrowerEmail: friend.borrowerEmail,
                        borrowerPhone: friend.borrowerPhone,
                      }))
                    }}
                  />
                )}
              </div>
              <Input
                id="borrowerName"
                name="borrowerName"
                placeholder="Sarah Chen"
                value={formData.borrowerName}
                onChange={handleChange}
                className="h-12 bg-input border-border"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="borrowerEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="borrowerEmail"
                  name="borrowerEmail"
                  type="email"
                  placeholder="sarah@example.com"
                  value={formData.borrowerEmail}
                  onChange={handleChange}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrowerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone (Optional)
                </Label>
                <Input
                  id="borrowerPhone"
                  name="borrowerPhone"
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={formData.borrowerPhone}
                  onChange={handleChange}
                  className="h-12 bg-input border-border"
                />
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assetName" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Asset Name
                </Label>
                <Input
                  id="assetName"
                  name="assetName"
                  placeholder="e.g. Canon EOS R5 Camera"
                  value={formData.assetName}
                  onChange={handleChange}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetCategory" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Category
                </Label>
                <Select
                  value={formData.assetCategory}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, assetCategory: val }))
                  }
                >
                  <SelectTrigger className="h-12 bg-input border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedValue" className="flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                  Estimated Value (₹)
                </Label>
                <Input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="number"
                  placeholder="50000"
                  value={formData.estimatedValue}
                  onChange={handleChange}
                  className="h-12 bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Condition
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, condition: val }))
                  }
                >
                  <SelectTrigger className="h-12 bg-input border-border">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Expected Return Date
              </Label>
              <Input
                id="returnDate"
                name="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={handleChange}
                className="h-12 bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Usage Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                name="instructions"
                placeholder="e.g. Handle with care, return with full charge, no food/drinks near the item..."
                value={formData.instructions}
                onChange={handleChange}
                className="min-h-[100px] bg-input border-border resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Buffer Days */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <Lock className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-primary">Private Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Only visible to you, not the borrower. This gives you grace
                  period before sending reminders.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg">
                Buffer Days: {formData.bufferDays} days
              </Label>
              <Slider
                value={[formData.bufferDays]}
                onValueChange={handleSliderChange}
                min={0}
                max={14}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>No buffer</span>
                <span>2 weeks</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    If the return date is February 15 and buffer is 3 days:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Trust score starts dropping on February 18</li>
                    <li>AI reminders begin on February 18</li>
                    <li>The borrower sees February 15 as the due date</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Witness */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    Witness will receive an approval email
                  </p>
                  <p className="text-muted-foreground">
                    They can verify the agreement but will NOT see the monetary
                    value - only the item and parties involved.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="witnessName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Witness Name (Optional)
                </Label>
                <Input
                  id="witnessName"
                  name="witnessName"
                  placeholder="John Smith"
                  value={formData.witnessName}
                  onChange={handleChange}
                  className="h-12 bg-input border-border"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="witnessEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="witnessEmail"
                    name="witnessEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.witnessEmail}
                    onChange={handleChange}
                    className="h-12 bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="witnessPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone (Optional)
                  </Label>
                  <Input
                    id="witnessPhone"
                    name="witnessPhone"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={formData.witnessPhone}
                    onChange={handleChange}
                    className="h-12 bg-input border-border"
                  />
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Adding a witness is optional but recommended for high-value items.
            </p>
          </div>
        )}

        {/* Step 4: Upload Photos */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold">
                Upload Asset Photos
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload clear photos of the item being lent. Multiple photos recommended.
              </p>
            </div>

            {/* Photo Grid */}
            {formData.photoUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.photoUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-secondary/30">
                    <img
                      src={url}
                      alt={`Asset photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              htmlFor="asset-photos"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 p-10 transition-colors hover:border-primary/50 hover:bg-secondary/50 ${uploadingPhotos ? "pointer-events-none opacity-60" : ""
                }`}
            >
              <div className="text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary mx-auto">
                  <Image className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium">{uploadingPhotos ? "Uploading..." : "Click to upload photos"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PNG, JPG up to 10MB each
                </p>
              </div>
              <input
                id="asset-photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  These photos will be visible to the borrower and witness as
                  proof of the item&apos;s condition before lending.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex gap-3">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="h-12 flex-1 bg-transparent border-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Creating Agreement..." : "Create Agreement"}
          </Button>
        )}
      </div>
    </div>
  )
}
