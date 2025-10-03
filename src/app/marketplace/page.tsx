"use client"

import { useWalletStore } from "@/lib/use-wallet-store"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import Link from "next/link"
import { useEffect, useState } from "react"
import { TransactionStatus, type TransactionState } from "@/components/TransactionStatus"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ArrowLeft,
  LayoutDashboard,
  Wallet,
} from "lucide-react"

// --- Defines the shape of the Listing object returned by our backend API ---
interface ReputationScore {
  completed_jobs: number
  total_uptime_seconds: number
}

interface Listing {
  host_address: string
  listing_type: string
  price_per_second: number
  is_available: boolean
  is_rented: boolean
  active_job_id: number | null
  physical?: {
    gpu_model: string
    cpu_cores: number
    ram_gb: number
  }
  cloud?: {
    instance_type: string
  }
  reputation?: ReputationScore
}

// --- Defines the shape of the wallet account info ---
type AccountInfo = {
  address: string
  publicKey: string
}

// --- CONFIGURATION ---
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xc6cb811e72af6ce5036b2d8812536ce2fd6213a403a892a8b6b7154443da19ba"

const aptosConfig = new AptosConfig({ network: Network.TESTNET })
const aptos = new Aptos(aptosConfig)

// --- MAIN COMPONENT ---
export default function MarketplacePage() {
  // State from our global Zustand store for wallet info
  const { account, setAccount } = useWalletStore()

  // Local component state
  const [walletDetected, setWalletDetected] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionState, setTransactionState] = useState<TransactionState>({ status: "idle" })

  // State for the rental modal
  const [listingToRent, setListingToRent] = useState<Listing | null>(null)
  const [rentalDuration, setRentalDuration] = useState(10) // Default 10 minutes
  const [isRenting, setIsRenting] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1"

  // --- WALLET CONNECTION LOGIC ---
  useEffect(() => {
    if ("petra" in window) {
      setWalletDetected(true)
    }
  }, [])

  const connectWallet = async () => {
    if (!walletDetected || !window.petra) return
    try {
      const walletAccount = await window.petra.connect()
      setAccount(walletAccount)
    } catch (err: any) {
      console.error("Failed to connect wallet:", err)
      setAccount(null)
    }
  }

  const disconnectWallet = async () => {
    if (account && window.petra?.disconnect) {
      await window.petra?.disconnect()
      setAccount(null)
    }
  }

  // --- DATA FETCHING LOGIC ---
  const loadListings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${API_BASE}/listings`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch listings: HTTP ${res.status}`)

      const data = await res.json()

      // Enrich each listing with its on-chain reputation score
      const listingsWithReputation = await Promise.all(
        (data.items ?? []).map(async (listing: Listing) => {
          try {
            const repRes = await fetch(`${API_BASE}/reputation/${listing.host_address}`)
            if (repRes.ok) {
              const reputation = await repRes.json()
              if (reputation) {
                return { ...listing, reputation }
              }
            }
          } catch (e) {
            console.error(`Failed to fetch reputation for ${listing.host_address}`, e)
          }
          return listing
        }),
      )

      setListings(listingsWithReputation)
    } catch (err: any) {
      setError(err.message ?? "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to load listings when the component mounts
  useEffect(() => {
    loadListings()
  }, [])

  // --- TRANSACTION HANDLER ---
  const handleRent = async () => {
    if (!account || !listingToRent || !window.petra) {
      setError("Please connect your wallet and select a listing to rent.")
      return
    }
    if (rentalDuration <= 0) {
      setError("Rental duration must be greater than 0 minutes.")
      return
    }

    setIsRenting(true)
    setTransactionState({ status: "processing" })

    const durationInSeconds = rentalDuration * 60

    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::rent_machine_direct`,
      type_arguments: [],
      arguments: [listingToRent.host_address, durationInSeconds.toString()],
    }

    try {
      const response = await window.petra.signAndSubmitTransaction(payload)
      await aptos.waitForTransaction({ transactionHash: response.hash })

      setTransactionState({ status: "success", hash: response.hash })
      alert(`Rental successful!`)
      setListingToRent(null)
      // Refresh the list to show the new "is_rented" status
      loadListings()
    } catch (err: any) {
      console.error("Rental failed:", err)
      setTransactionState({ status: "error", message: err.message })
    } finally {
      setIsRenting(false)
      setTimeout(() => setTransactionState({ status: "idle" }), 10000)
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gradient">GPU Marketplace</h1>
              <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-accent" />
                <span>{listings.filter((l) => l.is_available && !l.is_rented).length} Available</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>

              {!account ? (
                <Button
                  onClick={connectWallet}
                  disabled={!walletDetected}
                  className="bg-gradient-to-r from-accent to-accent/80"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {walletDetected ? "Connect Wallet" : "Petra Not Found"}
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <TransactionStatus state={transactionState} onClear={() => setTransactionState({ status: "idle" })} />

        <div className="mb-8 space-y-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Discover GPU Power</h2>
            <p className="text-muted-foreground">Rent high-performance compute resources on-demand</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 card-gradient border-accent/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Cpu className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Machines</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 card-gradient border-success/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listings.filter((l) => l.is_available && !l.is_rented).length}</p>
                  <p className="text-sm text-muted-foreground">Available Now</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 card-gradient border-chart-2/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listings.filter((l) => l.is_rented).length}</p>
                  <p className="text-sm text-muted-foreground">Active Rentals</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {error && (
          <Card className="mb-6 p-4 bg-destructive/10 border-destructive/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-12 w-12 text-accent animate-spin" />
            <p className="text-muted-foreground">Loading available machines...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {listings.map((listing: Listing) => (
              <Card
                key={listing.host_address}
                className="p-6 card-gradient border-border/40 hover:border-accent/40 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="h-5 w-5 text-accent" />
                      <h3 className="text-xl font-bold">{listing.physical?.gpu_model || "Cloud Instance"}</h3>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{listing.host_address}</p>
                  </div>

                  {listing.is_available && !listing.is_rented ? (
                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted/50">
                      {listing.is_rented ? "Rented" : "Offline"}
                    </Badge>
                  )}
                </div>

                {listing.physical && (
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">CPU:</span>
                      <span className="font-semibold">{listing.physical.cpu_cores} cores</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">RAM:</span>
                      <span className="font-semibold">{listing.physical.ram_gb} GB</span>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price per second</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-accent">{listing.price_per_second}</span>
                      <span className="text-sm text-muted-foreground">Octas</span>
                    </div>
                  </div>
                </div>

                {listing.reputation && (
                  <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Host Reputation</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="font-semibold">{listing.reputation.completed_jobs}</span>
                        <span className="text-muted-foreground">Jobs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-chart-2" />
                        <span className="font-semibold">
                          {Math.round(listing.reputation.total_uptime_seconds / 60)}
                        </span>
                        <span className="text-muted-foreground">min Uptime</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setListingToRent(listing)}
                  disabled={!listing.is_available || listing.is_rented || !account}
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-lg group-hover:shadow-accent/20 transition-all"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {!account ? "Connect Wallet to Rent" : "Rent Machine"}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center card-gradient border-border/40">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted/30">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Machines Available</h3>
                <p className="text-muted-foreground">Check back later for available GPU resources</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {listingToRent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isRenting && setListingToRent(null)}
          />
          <Card className="relative z-10 w-full max-w-lg p-6 card-gradient border-accent/20 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gradient">Rent Machine</h3>
              <p className="text-sm text-muted-foreground">Configure your rental duration</p>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">{listingToRent.physical?.gpu_model}</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground truncate">Host: {listingToRent.host_address}</div>
            </div>

            <div className="mb-6">
              <label htmlFor="duration" className="block text-sm font-medium mb-2">
                Rental Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={rentalDuration}
                onChange={(e) => setRentalDuration(Math.max(1, Number(e.target.value)))}
                className="w-full p-3 rounded-lg bg-background border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Total cost:{" "}
                <span className="font-semibold text-accent">
                  {listingToRent.price_per_second * rentalDuration * 60}
                </span>{" "}
                Octas
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setListingToRent(null)} disabled={isRenting} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleRent}
                disabled={isRenting}
                className="flex-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
              >
                {isRenting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Confirm Rental
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
