"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  FileText,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

const faqs = [
  {
    q: "How does YourTrust protect my data?",
    a: "YourTrust uses Firebase Authentication for secure sign-in and MongoDB Atlas for encrypted data storage. All AI mediation conversations are processed through NEAR AI Cloud with TEE security.",
  },
  {
    q: "How is my Trust Score calculated?",
    a: "Your Trust Score starts at 70 and increases as you complete agreements on time, get verified (PAN verification adds +10), and receive positive reviews. Late payments or defaults will decrease your score.",
  },
  {
    q: "What happens if someone doesn't repay?",
    a: "The AI mediator will send reminders and facilitate a conversation between both parties. You can also request a witness review. The platform is designed for informal lending - we encourage amicable resolution.",
  },
  {
    q: "Can I cancel an agreement?",
    a: "Yes, agreements can be cancelled before they become active (before witness approval). Once active, both parties must agree to cancel, or the AI mediator can help negotiate a settlement.",
  },
  {
    q: "What is the buffer days feature?",
    a: "Buffer days allow borrowers to extend the due date by up to 7 days without needing lender approval. This provides flexibility while maintaining trust.",
  },
  {
    q: "How do I add a witness to my agreement?",
    a: "When creating an agreement, you can add a witness by providing their email. They will receive a notification to verify the agreement details. The agreement becomes active only after witness approval.",
  },
  {
    q: "Is there any fee for using YourTrust?",
    a: "YourTrust is currently free to use. We may introduce optional premium features in the future, such as advanced AI mediation or priority support.",
  },
]

export default function HelpSupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false)
      } else {
        router.push("/auth/signin")
      }
    })
    return () => unsubscribe()
  }, [router])

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
          <h1 className="text-xl font-bold">Help & Support</h1>
          <p className="text-sm text-muted-foreground">FAQs and contact support</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">Quick answers to common questions</p>
          </div>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-secondary/20 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/40 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Contact Support</h2>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Having trouble? Reach out to our support team and we'll get back to you as soon as possible.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <a href="mailto:support@yourtrust.app">
            <Mail className="mr-2 h-4 w-4" />
            Email Support
          </a>
        </Button>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/10 text-chart-3">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">About YourTrust</h2>
            <p className="text-sm text-muted-foreground">Version and legal information</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between rounded-lg bg-secondary/30 p-3">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">0.1.0</span>
          </div>
          <div className="flex justify-between rounded-lg bg-secondary/30 p-3">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium">Next.js 16</span>
          </div>
        </div>
      </div>
    </div>
  )
}
