"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

type Invoice = {
  id: string
  date: string
  amount: number
  currency: string
  status: string
  pdfUrl: string | null
}

export type SubscriptionData = {
  id: string
  status: "ACTIVE" | "CANCELLING" | "CANCELLED" | "EXPIRED" | "PAST_DUE"
  planName: string
  billingInterval: "MONTHLY" | "ANNUAL"
  price: number
  currency: string
  startDate: string
  endDate: string | null
  stripeSubId: string | null
  stripeCustomerId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  paymentMethod: PaymentMethod | null
  invoices: Invoice[]
}

type Props = {
  subscription: SubscriptionData | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}

function cardBrandLabel(brand: string): string {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    jcb: "JCB",
    unionpay: "UnionPay",
    diners: "Diners Club",
  }
  return map[brand.toLowerCase()] ?? brand
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SubscriptionData["status"] }) {
  const config = {
    ACTIVE:     { label: "Active",      bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle size={13} /> },
    CANCELLING: { label: "Cancelling",  bg: "bg-amber-100",  text: "text-amber-700",  icon: <Clock size={13} /> },
    CANCELLED:  { label: "Cancelled",   bg: "bg-gray-100",   text: "text-gray-600",   icon: <XCircle size={13} /> },
    EXPIRED:    { label: "Expired",     bg: "bg-gray-100",   text: "text-gray-600",   icon: <XCircle size={13} /> },
    PAST_DUE:   { label: "Past due",    bg: "bg-red-100",    text: "text-red-700",    icon: <AlertTriangle size={13} /> },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  )
}

// ── No subscription state ─────────────────────────────────────────────────────

function NoSubscription() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <CreditCard size={22} className="text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No active subscription</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Subscribe to unlock all modules, the Black Belt exam, and your certification.
      </p>
      <a
        href="/subscribe"
        className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        View plans
      </a>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SubscriptionManager({ subscription }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"cancel" | "reactivate" | "portal" | null>(null)
  const [confirm, setConfirm] = useState<"cancel" | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleCancel() {
    setConfirm(null)
    setLoading("cancel")
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel")
      showToast("Subscription scheduled for cancellation.", "success")
      router.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error")
    } finally {
      setLoading(null)
    }
  }

  async function handleReactivate() {
    setLoading("reactivate")
    try {
      const res = await fetch("/api/subscription/reactivate", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to reactivate")
      showToast("Subscription reactivated.", "success")
      router.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error")
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading("portal")
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to open portal")
      window.location.href = data.url
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong.", "error")
      setLoading(null)
    }
  }

  if (!subscription) return <NoSubscription />

  const { status, planName, billingInterval, price, currency, currentPeriodEnd, paymentMethod, invoices } = subscription

  const isActive     = status === "ACTIVE"
  const isCancelling = status === "CANCELLING"
  const isPastDue    = status === "PAST_DUE"
  const isInactive   = status === "CANCELLED" || status === "EXPIRED"

  return (
    <div className="space-y-6">
      {/* ── Plan overview ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current plan</p>
            <h2 className="text-xl font-bold text-gray-900">
              {planName} <span className="text-sm font-normal text-gray-500">/ {billingInterval === "MONTHLY" ? "month" : "year"}</span>
            </h2>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(price, currency)}
              <span className="text-sm font-normal text-gray-400 ml-1">
                {billingInterval === "MONTHLY" ? "per month" : "per year"}
              </span>
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Period info */}
        {currentPeriodEnd && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={15} className="text-gray-400" />
            {isCancelling ? (
              <span>
                Access until{" "}
                <strong className="text-amber-700">{formatDate(currentPeriodEnd)}</strong>
                {" "}— then cancelled
              </span>
            ) : isActive ? (
              <span>
                Renews <strong>{formatDate(currentPeriodEnd)}</strong>
              </span>
            ) : (
              <span>Ended {formatDate(currentPeriodEnd)}</span>
            )}
          </div>
        )}

        {/* Past due warning */}
        {isPastDue && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Your last payment failed. Please update your payment method to keep access.
            </span>
          </div>
        )}

        {/* Cancelling info */}
        {isCancelling && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            <Clock size={16} className="shrink-0 mt-0.5" />
            <span>
              Cancellation scheduled. You still have full access until{" "}
              <strong>{formatDate(currentPeriodEnd)}</strong>.
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-3">
          {/* Stripe billing portal — always shown if there's a customer ID */}
          {subscription.stripeCustomerId && (
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === "portal" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ExternalLink size={14} />
              )}
              Billing portal
            </button>
          )}

          {/* Cancel button — only when ACTIVE */}
          {isActive && (
            <button
              onClick={() => setConfirm("cancel")}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} />
              Cancel subscription
            </button>
          )}

          {/* Reactivate button — only when CANCELLING */}
          {isCancelling && (
            <button
              onClick={handleReactivate}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading === "reactivate" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Keep subscription
            </button>
          )}

          {/* Re-subscribe — when inactive */}
          {isInactive && (
            <a
              href="/subscribe"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Resubscribe
            </a>
          )}
        </div>
      </div>

      {/* ── Payment method ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
          Payment method
        </h3>
        {paymentMethod ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {cardBrandLabel(paymentMethod.brand)} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">
                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
              </p>
            </div>
            {subscription.stripeCustomerId && (
              <button
                onClick={handlePortal}
                disabled={loading !== null}
                className="ml-auto text-xs text-primary hover:underline disabled:opacity-50"
              >
                Update
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No payment method on file.</p>
        )}
      </div>

      {/* ── Billing history ────────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Billing history
          </h3>
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatCurrency(inv.amount, inv.currency)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(inv.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "open"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      PDF <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm cancel dialog ───────────────────────────────────── */}
      {confirm === "cancel" && (
        <ConfirmDialog
          title="Cancel subscription?"
          message={`You'll keep full access until ${formatDate(currentPeriodEnd)}. After that, your account will revert to free and you'll lose access to paid modules.`}
          confirmLabel="Yes, cancel"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleCancel}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
