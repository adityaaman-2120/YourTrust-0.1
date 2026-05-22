"use client"

import { ArrowLeft, Banknote, Package } from "lucide-react"
import Link from "next/link"

export default function CreatePage() {
  const options = [
    {
      id: "money-lending",
      title: "Money Lending",
      description: "Borrow or lend money",
      icon: Banknote,
      color: "text-emerald bg-emerald/10",
      href: "/dashboard/create/money-lending",
    },
    {
      id: "asset-lending",
      title: "Asset Lending",
      description: "Borrow or lend physical items",
      icon: Package,
      color: "text-blue-500 bg-blue-500/10",
      href: "/dashboard/create/asset-lending",
    },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Create Agreement</h1>
          <p className="text-sm text-muted-foreground">Choose the type of agreement you want to create</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon
          return (
            <Link
              key={opt.id}
              href={opt.href}
              className="group flex flex-col items-center justify-center text-center rounded-2xl border border-border bg-card p-8 min-h-[200px] transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${opt.color} mb-4`}>
                <Icon className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">{opt.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
