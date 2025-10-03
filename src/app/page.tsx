"use client"

import type React from "react"

import Link from "next/link"
import { useWalletStore } from "@/lib/use-wallet-store"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Cpu, Zap, Shield, TrendingUp, ChevronRight, Sparkles, Server } from "lucide-react"

export default function HomePage() {
  const { account, setAccount } = useWalletStore()
  const [walletDetected, setWalletDetected] = useState(false)
  const [email, setEmail] = useState("")

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

  const handleEarlyAccess = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Thank you for your interest! We'll notify you about our mainnet launch.")
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Cpu className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Axess Protocol</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/marketplace"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/host"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Become a Host
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              {!account ? (
                <Button
                  onClick={connectWallet}
                  disabled={!walletDetected}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {walletDetected ? "Connect Wallet" : "Install Petra"}
                </Button>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button onClick={disconnectWallet} variant="outline" size="sm">
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background Blurs */}
        <div className="gradient-blur absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary rounded-full" />
        <div className="gradient-blur absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent rounded-full" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Aptos Blockchain</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance leading-tight">
              Decentralized GPU Cloud for <span className="text-gradient">AI & Compute</span>
            </h1>

              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-balance leading-relaxed">
                Access a global network of GPU providers for machine learning, rendering, and scientific computing.
                Trustless, transparent, and powered by blockchain.
                You haven&apos;t created any projects yet.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/marketplace">
                <Button size="lg" className="text-base h-12 px-8 bg-primary hover:bg-primary/90">
                  Browse GPUs
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/host">
                <Button size="lg" variant="outline" className="text-base h-12 px-8 bg-transparent">
                  Become a Host
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Active Hosts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">1000+</div>
                <div className="text-sm text-muted-foreground">Compute Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Axess Protocol?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for developers who need reliable, affordable, and decentralized compute power
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 card-gradient border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your wallet and start computing in seconds. No lengthy signup process.
              </p>
            </Card>

            <Card className="p-6 card-gradient border-border/50 hover:border-accent/50 transition-all duration-300 hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trustless Escrow</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Smart contract-based payments ensure fair transactions for both renters and hosts.
              </p>
            </Card>

            <Card className="p-6 card-gradient border-border/50 hover:border-success/50 transition-all duration-300 hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 mb-4">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Competitive Pricing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Market-driven rates ensure you get the best value for your compute needs.
              </p>
            </Card>

            <Card className="p-6 card-gradient border-border/50 hover:border-warning/50 transition-all duration-300 hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 mb-4">
                <Server className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track GPU utilization, memory usage, and costs in real-time from your dashboard.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 mx-auto mb-6">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Wallet</h3>
              <p className="text-muted-foreground leading-relaxed">
                Install Petra wallet and connect to the Aptos testnet. Fund your wallet with test APT.
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border-2 border-accent/20 mx-auto mb-6">
                <span className="text-2xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Browse & Rent</h3>
              <p className="text-muted-foreground leading-relaxed">
                Explore available GPUs, check host reputation, and rent the perfect machine for your workload.
              </p>
            </div>

            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 border-2 border-success/20 mx-auto mb-6">
                <span className="text-2xl font-bold text-success">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Computing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Launch your AI notebook, run your workloads, and monitor usage in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="container mx-auto">
          <Card className="p-8 sm:p-12 card-gradient border-primary/20 relative overflow-hidden">
            <div className="gradient-blur absolute -top-20 -right-20 w-[300px] h-[300px] bg-primary rounded-full" />
            <div className="gradient-blur absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-accent rounded-full" />

            <div className="max-w-2xl mx-auto text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Early Access</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We&apos;re currently in closed beta on Aptos Testnet. Sign up to get notified about our mainnet launch, new
                features, and developer incentives.
              </p>

              <form onSubmit={handleEarlyAccess} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                />
                <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90">
                  Notify Me
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Cpu className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Axess Protocol</span>
            </Link>

            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/marketplace" className="hover:text-foreground transition-colors">
                Marketplace
              </Link>
              <Link href="/host" className="hover:text-foreground transition-colors">
                Host
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>© 2025 Aptos Compute. Built for the Aptos Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
