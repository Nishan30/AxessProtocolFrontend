"use client"

import { BillingMetrics } from "@/components/BillingMetrics"
import { SessionStats } from "@/components/SessionStats"
import { useWalletStore } from "@/lib/use-wallet-store"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Play,
  Square,
  ExternalLink,
  Wallet,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Server,
} from "lucide-react"


// --- Types ---
interface Job {
  job_id: number
  host_address: string
  listing_id: number
  is_active: boolean
}

interface GpuStats {
  gpu_utilization_percent: number
  memory_used_mb: number
  memory_total_mb: number
}

interface SessionDetails {
  status?: "ready" | "pending" | string
  public_url: string | null
  token: string | null
  stats: GpuStats | null
  price_per_second: number
  uptime_seconds: number
  current_cost_octas: number
  error?: string | null
}

type PollKind = "pending" | "ready"

const RenterDashboard = () => {
  const { account, setAccount } = useWalletStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionDetails, setSessionDetails] = useState<Record<number, SessionDetails | null>>({})
  const [walletDetected, setWalletDetected] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1"

  // Detect Petra
  useEffect(() => {
    setWalletDetected(typeof window !== "undefined" && "petra" in window)
  }, [])

  // Connect / disconnect wallet
  const connectWallet = async () => {
    if (!walletDetected || !window.petra) return
    try {
      const walletAccount = await window.petra.connect()
      setAccount(walletAccount)
      console.log("Connected account:", walletAccount)
    } catch (err) {
      console.error("Failed to connect wallet:", err)
      setAccount(null)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (account && window.petra?.disconnect) {
        await window.petra.disconnect()
      }
    } finally {
      setAccount(null)
    }
  }

  // Fetch renter jobs
  useEffect(() => {
    const fetchRenterJobs = async () => {
      if (!account?.address) {
        setJobs([])
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/renters/${account.address}/jobs`)
        if (!res.ok) throw new Error(`Failed to fetch jobs (${res.status})`)
        const data: Job[] = await res.json()
        setJobs(data)
      } catch (e) {
        console.error("Error fetching renter jobs:", e)
        setJobs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRenterJobs()
  }, [account, API_BASE])

  // Polling management (use timeouts so we can vary delay)
  const pollTimersRef = useRef<Record<number, number>>({})
  const pollDelaysRef = useRef<Record<number, number>>({})
  const pageVisibleRef = useRef<boolean>(true)

  useEffect(() => {
    const handler = () => {
      pageVisibleRef.current = document.visibilityState === "visible"
    }
    document.addEventListener("visibilitychange", handler)
    pageVisibleRef.current = document.visibilityState === "visible"
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  const clearPoll = (jobId: number) => {
    const t = pollTimersRef.current[jobId]
    if (t) {
      clearTimeout(t)
      delete pollTimersRef.current[jobId]
    }
  }

  const scheduleNext = (jobId: number, delayMs: number, kind: PollKind) => {
    pollDelaysRef.current[jobId] = delayMs
    clearPoll(jobId)
    const id = window.setTimeout(() => pollOnce(jobId, kind), delayMs)
    pollTimersRef.current[jobId] = id
  }

  const buildNotebookUrl = (sd: SessionDetails) => {
    if (!sd?.public_url || !sd?.token) return "#"
    const base = sd.public_url.replace(/\/$/, "")
    return `${base}/tree?token=${encodeURIComponent(sd.token)}`
  }

  const pollOnce = async (jobId: number, kind: PollKind) => {
    // If tab is hidden, reschedule the same delay without fetching
    if (!pageVisibleRef.current) {
      const lastDelay = pollDelaysRef.current[jobId] ?? (kind === "ready" ? 10000 : 3000)
      scheduleNext(jobId, lastDelay, kind)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/session`)
      const retryAfterHeader = res.headers.get("Retry-After")
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 0

      if (res.status === 200) {
        const payload = (await res.json()) as SessionDetails
        setSessionDetails((prev) => ({ ...prev, [jobId]: payload }))

        const readyNow = payload?.status === "ready" && !!payload?.public_url && !!payload?.token && !payload?.error

        // Once ready, poll slower (10s) to update stats/billing
        if (readyNow) {
          scheduleNext(jobId, 10000, "ready")
        } else {
          // Not fully ready or transient error; keep pending cadence with mild backoff
          const lastDelay = pollDelaysRef.current[jobId] ?? 3000
          const nextDelay = Math.min(10000, Math.max(3000, Math.floor(lastDelay * 1.3)))
          scheduleNext(jobId, nextDelay, "pending")
        }
      } else if (res.status === 202) {
        // Pending on server side; obey Retry-After if provided, else backoff up to 10s
        const lastDelay = pollDelaysRef.current[jobId] ?? 3000
        const nextDelay =
          retryAfter > 0 ? retryAfter * 1000 : Math.min(10000, Math.max(3000, Math.floor(lastDelay * 1.5)))
        scheduleNext(jobId, nextDelay, "pending")
      } else if (res.status === 404) {
        // Not found yet; keep trying on a fixed cadence
        scheduleNext(jobId, 5000, "pending")
      } else {
        // Unexpected; try again later
        scheduleNext(jobId, 8000, kind)
      }
    } catch (e) {
      console.error("Polling error:", e)
      // Network/transient error -> retry with backoff
      const lastDelay = pollDelaysRef.current[jobId] ?? 3000
      const nextDelay = Math.min(12000, Math.max(3000, Math.floor(lastDelay * 1.7)))
      scheduleNext(jobId, nextDelay, kind)
    }
  }

  // Start session & begin polling (no recursive /start calls)
  const handleStartJob = async (jobId: number) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}/start`, { method: "POST" })

      if (res.status === 200) {
        // Backend may return "already_running" with details
        const payload = (await res.json()) as SessionDetails & { status?: string }
        if (payload?.status === "already_running" && payload.public_url && payload.token) {
          setSessionDetails((prev) => ({ ...prev, [jobId]: payload }))
          // Start slow polling as it's already ready
          scheduleNext(jobId, 10000, "ready")
          return
        }
      }

      alert("Start command issued! Waiting for session to become ready...")

      // Begin pending polling (3s cadence, with adaptive backoff)
      scheduleNext(jobId, 3000, "pending")
    } catch (error) {
      console.error("Failed to start job:", error)
      alert("Failed to issue start command.")
    }
  }

  // Stop session & stop polling
  const handleStopJob = async (jobId: number) => {
    if (!confirm(`Are you sure you want to stop job ${jobId}?`)) return

    clearPoll(jobId)

    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}/stop`, { method: "POST" })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server error ${response.status}`)
      }
      alert(`Stop command issued for job ${jobId}.`)
      setSessionDetails((prev) => ({ ...prev, [jobId]: null }))
    } catch (error) {
      console.error("Failed to stop job:", error)
      alert(`Failed to issue stop command: ${error}`)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(pollTimersRef.current).forEach(clearTimeout)
      pollTimersRef.current = {}
      pollDelaysRef.current = {}
    }
  }, [])

  const activeJobs = jobs.filter((j) => j.is_active)
  const completedJobs = jobs.filter((j) => !j.is_active)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Renter Dashboard</h1>
            <p className="text-muted-foreground">Manage your active GPU rentals and sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={!walletDetected}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/25"
              >
                <Wallet className="h-4 w-4" />
                {walletDetected ? "Connect Wallet" : "Petra Not Found"}
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold px-6 py-2.5 rounded-lg transition-all"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {!account ? (
          <div className="text-center p-12 rounded-xl bg-card border border-border/50 card-gradient">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please connect your Petra wallet to view your active and past GPU rentals.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Rentals */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
                <h2 className="text-2xl font-semibold">Active Rentals</h2>
                {activeJobs.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {activeJobs.length}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-12 rounded-xl bg-card border border-border/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="space-y-6">
                  {activeJobs.map((job) => {
                    const sd = sessionDetails[job.job_id] || undefined
                    const isReady =
                      !!sd && !sd.error && !!sd.public_url && !!sd.token && (sd.status ?? "ready") === "ready"

                    return (
                      <div
                        key={job.job_id}
                        className="p-6 rounded-xl bg-card border border-border/50 card-gradient hover:border-primary/30 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <Server className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold">Job #{job.job_id}</h3>
                                <p className="text-sm text-muted-foreground">Listing ID: {job.listing_id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Host:</span>
                              <code className="px-2 py-1 rounded bg-muted/50 font-mono text-xs">
                                {job.host_address.slice(0, 8)}...{job.host_address.slice(-6)}
                              </code>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => handleStartJob(job.job_id)}
                              disabled={isReady}
                              className="flex items-center gap-2 bg-gradient-to-r from-success to-success/80 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-success/25"
                            >
                              {isReady ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Running
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />
                                  Start Session
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleStopJob(job.job_id)}
                              disabled={!isReady}
                              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-destructive-foreground font-semibold px-5 py-2.5 rounded-lg transition-all"
                            >
                              <Square className="h-4 w-4" />
                              Stop
                            </button>
                            {isReady && (
                              <a
                                href={buildNotebookUrl(sd)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent/80 hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-accent/25"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Launch Notebook
                              </a>
                            )}
                          </div>
                        </div>

                        {sd?.error && (
                          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-destructive mb-1">Session Error</p>
                              <p className="text-sm text-destructive/80">{sd.error}</p>
                            </div>
                          </div>
                        )}

                        {isReady && (
                          <div className="mt-6 p-6 rounded-lg bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                              <h4 className="font-semibold text-success">Session Active</h4>
                            </div>

                            <SessionStats stats={sd?.stats ?? null} />

                            <BillingMetrics
                              price_per_second={sd!.price_per_second}
                              uptime_seconds={sd!.uptime_seconds}
                              current_cost_octas={sd!.current_cost_octas}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center p-12 rounded-xl bg-card border border-border/50 card-gradient">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                    <Server className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Active Rentals</h3>
                  <p className="text-muted-foreground mb-6">You don&apos;t have any active GPU rentals at the moment.</p>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/25"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>

            {/* Rental History */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-gradient-to-b from-muted-foreground to-muted rounded-full" />
                <h2 className="text-2xl font-semibold">Rental History</h2>
                {completedJobs.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                    {completedJobs.length}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-12 rounded-xl bg-card border border-border/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : completedJobs.length > 0 ? (
                <div className="space-y-3">
                  {completedJobs.map((job) => (
                    <div
                      key={job.job_id}
                      className="p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Job #{job.job_id}</h4>
                          <p className="text-sm text-muted-foreground">
                            Host: {job.host_address.slice(0, 8)}...{job.host_address.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 rounded-xl bg-card border border-border/50">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Rental History</h3>
                  <p className="text-muted-foreground">You haven&apos;t completed any GPU rentals yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default RenterDashboard
