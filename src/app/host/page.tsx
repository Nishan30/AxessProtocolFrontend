"use client"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useWalletStore } from "@/lib/use-wallet-store"
import { Server, Cpu, HardDrive, Zap, ArrowLeft, Download, Power } from "lucide-react"
import { Button } from "@/components/ui/button"

// Defines the shape of the Listing object returned by the /hosts/{address} endpoint
interface HostListing {
  host_address: string
  is_available: boolean
  is_rented: boolean
  price_per_second: number
  physical: {
    gpu_model: string
    cpu_cores: number
    ram_gb: number
  } | null
  cloud: {
    instance_type: string
  } | null
}

const HostDashboard = () => {
  const { account, setAccount } = useWalletStore()
  const [walletDetected, setWalletDetected] = useState(false)

  // A host has only one listing, so the state is a single object or null
  const [listing, setListing] = useState<HostListing | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1"
  // This is the link to the .zip file of your agent hosted on GitHub Releases
  const AGENT_DOWNLOAD_URL = "https://github.com/aniJani/oracleAgent/releases/download/AxessAgentv0.2/Axess.Protocol.Agent.exe"

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
    } catch (err: unknown) {
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

  // Use useCallback to memoize the fetch function
  const fetchHostListing = useCallback(async () => {
    if (!account?.address) return
    
    setIsLoading(true)
    setError(null)
    try {
      // Use the new, simpler endpoint for getting a single host's listing
      const response = await fetch(`${API_BASE}/hosts/${account.address}`)
      if (!response.ok) {
        // A 404 from this endpoint is not an error, it just means the host has never registered.
        if (response.status === 404) {
          setListing(null)
        } else {
            const errData = await response.json()
            throw new Error(errData.detail || `Failed to fetch listing (HTTP ${response.status})`)
        }
      } else {
        const data: HostListing = await response.json()
        setListing(data)
      }
    } catch (err: unknown) {
      console.error("Failed to fetch host listing. Please make sure you have downloaded the agent and registered your host using this wallet's private key.", err)
      setError("Please make sure you have downloaded the agent and registered your host using this wallet's private key.")
      setListing(null)
    } finally {
      setIsLoading(false)
    }
  }, [account, API_BASE])


  useEffect(() => {
    fetchHostListing()
  }, [fetchHostListing])


  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background decorative gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/10 blur-3xl rounded-full translate-y-1/4 -translate-x-1/4" />

      <div className="relative z-10 flex flex-col items-center p-6 md:p-12">
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                Host Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">Manage your compute resources and on-chain status.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="gap-2">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Link>
              </Button>
              {!account ? (
                <Button onClick={connectWallet} disabled={!walletDetected}>
                  {walletDetected ? "Connect Petra Wallet" : "Petra Not Found"}
                </Button>
              ) : (
                <Button onClick={disconnectWallet} variant="destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          {!account ? (
            <div className="text-center bg-card/50 backdrop-blur-sm border border-border p-12 rounded-xl animate-fade-in">
              <Server className="w-12 h-12 text-purple-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Please connect your Petra wallet to view your machine&apos;s status or to get started as a host.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Host Status */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-semibold">Your On-Chain Status</h2>
                
                {isLoading && (
                  <div className="bg-card/50 backdrop-blur-sm border border-border p-12 rounded-xl text-center">
                    <div className="inline-block w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Fetching your on-chain data...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 text-destructive p-6 rounded-xl">
                    <p className="font-semibold mb-1">Error Loading Status</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                )}
                
                {!isLoading && !error && !listing && (
                     <div className="bg-card/50 backdrop-blur-sm border border-dashed border-border p-12 rounded-xl text-center animate-fade-in">
                      <Server className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">You are not registered as a host.</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Follow the instructions to download and run the one-time registration script.
                      </p>
                    </div>
                )}

                {listing && (
                    <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl transition-all hover:border-purple-500/50 animate-fade-in group">
                      <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-bold text-2xl mb-1">
                              {listing.physical?.gpu_model || "Unknown Machine"}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono truncate">Host Address: {listing.host_address}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-2 ${listing.is_available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                <Power className="w-3 h-3"/> {listing.is_available ? 'Online' : 'Offline'}
                             </span>
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-2 ${listing.is_rented ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                <Zap className="w-3 h-3"/> {listing.is_rented ? 'Rented' : 'Not Rented'}
                             </span>
                          </div>
                      </div>

                      {listing.physical && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
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
                            <span className="text-muted-foreground">Rate:</span>
                            <span className="font-semibold">{listing.price_per_second} Octas/s</span>
                          </div>
                        </div>
                      )}
                    </div>
                )}
              </div>

              {/* Right Column: Instructions */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Host Instructions</h2>
                <div className="bg-card/50 backdrop-blur-sm border border-border p-6 rounded-xl space-y-6 sticky top-6 animate-fade-in">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Simple 3-Step Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Our agent software makes it easy to connect your machine to the network.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="font-bold text-purple-400 text-2xl">1</div>
                      <div>
                        <h4 className="font-semibold">Download the Agent</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get the latest agent software for your OS. 
                        </p>
                        <Button asChild>
                           <a href={AGENT_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <Download className="w-4 h-4"/> Download Agent (.exe)
                           </a>
                        </Button>
                      </div>
                    </div>
                     <div className="flex items-start gap-4">
                      <div className="font-bold text-purple-400 text-2xl">2</div>
                      <div>
                        <h4 className="font-semibold">Configure Your Details</h4>
                        <p className="text-sm text-muted-foreground">
                          Open this app and add your Aptos private key and your price.
                        </p>
                      </div>
                    </div>
                     <div className="flex items-start gap-4">
                      <div className="font-bold text-purple-400 text-2xl">3</div>
                      <div>
                        <h4 className="font-semibold">Go Online</h4>
                        <p className="text-sm text-muted-foreground">
                          The agent will register your machine (first time only), bring it online, and begin listening for jobs. Just leave the terminal window running.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Prerequisites: An NVIDIA GPU, Docker, Python, and a free ngrok account.
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

export default HostDashboard;