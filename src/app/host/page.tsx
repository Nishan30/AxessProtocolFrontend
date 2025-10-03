"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useWalletStore } from "@/lib/use-wallet-store"
import { Server, Cpu, HardDrive, Zap, Copy, Check, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AccountInfo {
  address: string
  publicKey: string
}

interface HostListing {
  id: number
  host_address: string
  is_available: boolean
  price_per_second: number
  physical: {
    gpu_model: string
    cpu_cores: number
    ram_gb: number
  } | null
  cloud: {
    provider: string
    instance_id: string
    instance_type: string
    region: string
  } | null
}

const HostDashboard = () => {
  const { account, setAccount } = useWalletStore()
  const [walletDetected, setWalletDetected] = useState(false)

  const [listings, setListings] = useState<HostListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1"
  const CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0xc6cb811e72af6ce5036b2d8812536ce2fd6213a403a892a8b6b7154443da19ba"

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

  useEffect(() => {
    if (account?.address) {
      const fetchHostListings = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch(`${API_BASE}/hosts/${account.address}/listings`)
          if (!response.ok) {
            const errData = await response.json()
            throw new Error(errData.detail || `Failed to fetch listings (HTTP ${response.status})`)
          }
          const data: HostListing[] = await response.json()
          setListings(data)
        } catch (err: any) {
          console.error("Failed to fetch host listings:", err)
          setError(err.message)
          setListings([])
        } finally {
          setIsLoading(false)
        }
      }

      fetchHostListings()
    } else {
      setListings([])
    }
  }, [account, API_BASE])

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="gradient-blur w-[500px] h-[500px] bg-purple-500 absolute top-0 right-0 rounded-full" />
      <div className="gradient-blur w-[400px] h-[400px] bg-blue-500 absolute bottom-0 left-0 rounded-full" />

      <div className="relative z-10 flex flex-col items-center p-6 md:p-12 lg:p-24">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="text-gradient">Host Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">Manage your compute resources and earnings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="gap-2">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Marketplace
                </Link>
              </Button>
              {!account ? (
                <Button
                  onClick={connectWallet}
                  disabled={!walletDetected}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {walletDetected ? "Connect Petra Wallet" : "Petra Not Found"}
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {!account ? (
            <div className="text-center card-gradient border border-border p-12 rounded-xl animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Server className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Please connect your Petra wallet to manage your listings or become a host on the marketplace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Your On-Chain Listings</h2>
                  <div className="text-sm text-muted-foreground">
                    {listings.length} {listings.length === 1 ? "listing" : "listings"}
                  </div>
                </div>

                {isLoading && (
                  <div className="card-gradient border border-border p-12 rounded-xl text-center">
                    <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading your listings...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 text-destructive p-6 rounded-xl">
                    <p className="font-semibold mb-1">Error loading listings</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                )}

                {!isLoading && !error && listings.length === 0 && (
                  <div className="card-gradient border border-dashed border-border p-12 rounded-xl text-center animate-fade-in">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Server className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Follow the instructions on the right to run the Host Agent and list your machine on the
                      marketplace!
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="card-gradient border border-border p-6 rounded-xl transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 animate-fade-in group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-xl mb-1">
                              {listing.physical?.gpu_model || listing.cloud?.instance_type || "Unknown Machine"}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono">Listing ID: {listing.id}</p>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                            listing.is_available
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              listing.is_available ? "bg-green-400" : "bg-yellow-400"
                            } animate-pulse`}
                          />
                          {listing.is_available ? "Available" : "Rented"}
                        </span>
                      </div>

                      {listing.physical && (
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-sm">
                            <Cpu className="w-4 h-4 text-purple-400" />
                            <span className="text-muted-foreground">CPU:</span>
                            <span className="font-semibold">{listing.physical.cpu_cores} cores</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HardDrive className="w-4 h-4 text-blue-400" />
                            <span className="text-muted-foreground">RAM:</span>
                            <span className="font-semibold">{listing.physical.ram_gb} GB</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-cyan-400" />
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-semibold">{listing.price_per_second} APT/s</span>
                          </div>
                        </div>
                      )}

                      {listing.cloud && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Provider:</span>
                            <span className="font-semibold ml-2">{listing.cloud.provider}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Region:</span>
                            <span className="font-semibold ml-2">{listing.cloud.region}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Become a Host</h2>
                <div className="card-gradient border border-border p-6 rounded-xl space-y-6 sticky top-6 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">One-Step Agent Setup</h3>
                      <p className="text-sm text-muted-foreground">
                        Run our Python agent on your machine to list it on the marketplace.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-mono text-xs text-muted-foreground">
                          1. Create a <code className="bg-muted px-1.5 py-0.5 rounded">.env</code> file:
                        </label>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `HOST_PRIVATE_KEY=YOUR_HOST_WALLET_PRIVATE_KEY\nCONTRACT_ADDRESS=${CONTRACT_ADDRESS}`,
                              0,
                            )
                          }
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedIndex === 0 ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-black/50 border border-border p-4 rounded-lg text-xs overflow-x-auto font-mono text-slate-300">
                        {`HOST_PRIVATE_KEY=YOUR_HOST_WALLET_PRIVATE_KEY
CONTRACT_ADDRESS=${CONTRACT_ADDRESS}`}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-mono text-xs text-muted-foreground">2. Install dependencies:</label>
                        <button
                          onClick={() => copyToClipboard("pip install aptos-sdk python-dotenv psutil docker", 1)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedIndex === 1 ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-black/50 border border-border p-4 rounded-lg text-xs overflow-x-auto font-mono text-slate-300">
                        pip install aptos-sdk python-dotenv psutil docker
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-mono text-xs text-muted-foreground">3. Run the agent:</label>
                        <button
                          onClick={() => copyToClipboard("python agent.py", 2)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedIndex === 2 ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <pre className="bg-black/50 border border-border p-4 rounded-lg text-xs overflow-x-auto font-mono text-slate-300">
                        python agent.py
                      </pre>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      The agent will automatically detect your hardware, register it on-chain, and start accepting
                      rental requests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default HostDashboard
