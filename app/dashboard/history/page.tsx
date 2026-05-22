"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Package,
  Banknote,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"

interface Agreement {
  _id: string
  borrowerName: string
  borrowerEmail: string
  lenderName: string
  amount: number
  estimatedValue?: number
  assetName?: string
  assetCategory?: string
  assetCondition?: string
  dealType?: 'money' | 'asset'
  type: 'lent' | 'borrowed'
  purpose?: string
  dueDate: string
  status: 'active' | 'pending_witness' | 'reviewing' | 'settled' | 'overdue'
  witnessApproved: boolean
  lenderId: string
  borrowerId?: string
  createdAt: string
}

type FilterOption = 'all' | 'money' | 'asset'

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-primary/20 text-primary" },
  pending_witness: { label: "Pending Witness", color: "bg-orange/20 text-orange" },
  reviewing: { label: "Reviewing", color: "bg-chart-3/20 text-chart-3" },
  settled: { label: "Settled", color: "bg-muted text-muted-foreground" },
  overdue: { label: "Overdue", color: "bg-red-500/20 text-red-500" },
}

function AgreementCard({ agreement }: { agreement: Agreement }) {
  const daysUntilDue = Math.ceil(
    (new Date(agreement.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const isAsset = agreement.dealType === 'asset'
  const displayAmount = isAsset ? (agreement.estimatedValue || agreement.amount) : agreement.amount

  return (
    <Link
      href={`/dashboard/agreement/${agreement._id}`}
      className="block rounded-xl border border-border bg-card p-4 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isAsset ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
            {isAsset ? <Package className="h-4 w-4 text-purple-500" /> : <Banknote className="h-4 w-4 text-blue-500" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {isAsset ? (agreement.assetName || 'Item') : agreement.borrowerName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {agreement.type === 'lent' ? 'You lent' : 'You borrowed'}
              {isAsset ? ` · ${agreement.assetCategory || ''}` : ` · ${agreement.purpose || 'No purpose'}`}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="font-bold text-sm">
            ₹{displayAmount.toLocaleString()}
          </div>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[agreement.status]?.color || ''}`}>
            {statusConfig[agreement.status]?.label || agreement.status}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(agreement.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className={`flex items-center gap-1 ${daysUntilDue < 0 ? 'text-red-500' : ''}`}>
          <Clock className="h-3 w-3" />
          {daysUntilDue > 0 ? `${daysUntilDue}d left` : daysUntilDue === 0 ? 'Due today' : `${Math.abs(daysUntilDue)}d overdue`}
        </div>
      </div>
    </Link>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterOption>('all')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid)
        await fetchAgreements(user.uid)
      } else {
        router.push('/auth/signin')
      }
    })
    return () => unsubscribe()
  }, [router])

  const fetchAgreements = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agreements?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        const mapped = (data.agreements || []).map((a: any) => ({
          ...a,
          type: a.lenderId === userId ? 'lent' : 'borrowed',
        }))
        setAgreements(mapped)
      }
    } catch (error) {
      console.error('Error fetching agreements:', error)
    } finally {
      setLoading(false)
    }
  }

  const moneyAgreements = agreements.filter(
    (a) => !a.dealType || a.dealType === 'money'
  )
  const assetAgreements = agreements.filter((a) => a.dealType === 'asset')

  const showMoney = filter === 'all' || filter === 'money'
  const showAsset = filter === 'all' || filter === 'asset'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Agreement History</h1>
          <p className="text-sm text-muted-foreground">View all your past and current agreements</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', 'money', 'asset'] as FilterOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === opt
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt === 'money' && <Banknote className="h-3.5 w-3.5" />}
            {opt === 'asset' && <Package className="h-3.5 w-3.5" />}
            {opt === 'all' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Money Agreements - Left */}
          {showMoney && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <Banknote className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold">Money Agreements</h2>
                <span className="text-xs text-muted-foreground">({moneyAgreements.length})</span>
              </div>
              {moneyAgreements.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Banknote className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No money agreements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moneyAgreements.map((agreement) => (
                    <AgreementCard key={agreement._id} agreement={agreement} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Asset Agreements - Right */}
          {showAsset && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <Package className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold">Asset Agreements</h2>
                <span className="text-xs text-muted-foreground">({assetAgreements.length})</span>
              </div>
              {assetAgreements.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No asset agreements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assetAgreements.map((agreement) => (
                    <AgreementCard key={agreement._id} agreement={agreement} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
