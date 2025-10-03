"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Code2, Cpu, Zap, Shield, Rocket, Terminal, FileCode, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"user" | "developer">("user")

  return (
    <main className="min-h-screen bg-background">
      {/* Gradient background effects */}
      <div className="gradient-blur w-[600px] h-[600px] bg-chart-1 top-0 left-1/4 fixed" />
      <div className="gradient-blur w-[500px] h-[500px] bg-chart-2 top-1/3 right-1/4 fixed" />

      <div className="relative">
        {/* Header */}
        <div className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-chart-1" />
              <h1 className="text-2xl font-bold">Documentation</h1>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <div className="flex gap-2 border-b border-border/50">
            <button
              onClick={() => setActiveTab("user")}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === "user" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                User Guide
              </div>
              {activeTab === "user" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-chart-1 to-chart-2" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("developer")}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === "developer" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Developer Protocol
              </div>
              {activeTab === "developer" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-chart-1 to-chart-2" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">{activeTab === "user" ? <UserGuide /> : <DeveloperGuide />}</div>
      </div>
    </main>
  )
}

function UserGuide() {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Introduction */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Getting Started Guide</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Welcome to the Unified Compute Marketplace! This guide will help you get started as either a Renter or a Host.
        </p>
      </section>

      {/* For Renters */}
      <section>
        <Card className="p-8 card-gradient border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/20">
              <Zap className="w-6 h-6 text-chart-1" />
            </div>
            <h3 className="text-2xl font-bold">For Renters: Using a GPU</h3>
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Renting a GPU for your AI/ML tasks is a simple, five-step process:
          </p>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Connect Your Wallet",
                description:
                  "Visit the marketplace and connect your Petra wallet. Ensure you have Testnet APT for payments.",
                icon: Shield,
              },
              {
                step: 2,
                title: "Rent a Machine",
                description:
                  "Browse the list of online hosts. Look at their reputation and GPU specs, then click 'Rent', choose your duration, and approve the transaction.",
                icon: Cpu,
              },
              {
                step: 3,
                title: "Go to Your Dashboard",
                description: "Navigate to the 'Renter Dashboard' to manage your active rentals.",
                icon: Terminal,
              },
              {
                step: 4,
                title: "Start Your Session",
                description:
                  "Click 'Start Session'. The system will securely prepare a Jupyter Notebook for you on the host's machine. A 'Launch AI Notebook' button will appear.",
                icon: Rocket,
              },
              {
                step: 5,
                title: "Run Your Job",
                description:
                  "Click 'Launch', connect with the provided token, upload your Python scripts (like our train.py demo), and run your computation. You can monitor live GPU and billing stats directly from your dashboard.",
                icon: CheckCircle2,
              },
            ].map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="flex gap-4 group">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-chart-1/10 border border-chart-1/20 flex items-center justify-center font-bold text-chart-1 group-hover:bg-chart-1/20 transition-colors">
                    {step}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-chart-1" />
                    <h4 className="font-semibold text-lg">{title}</h4>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* For Hosts */}
      <section>
        <Card className="p-8 card-gradient border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/20">
              <Cpu className="w-6 h-6 text-chart-2" />
            </div>
            <h3 className="text-2xl font-bold">For Hosts: Providing a GPU</h3>
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Our goal is to make hosting as simple as possible. You will use our secure, one-step Host Agent software to
            connect your machine to the network.
          </p>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Download the Agent",
                description: "Get the latest version from our GitHub Releases page.",
              },
              {
                step: 2,
                title: "Configure",
                description:
                  "Run the setup script, which will create a config.ini file. Edit this file with your Aptos private key and ngrok authtoken.",
              },
              {
                step: 3,
                title: "Go Online",
                description:
                  "Run the same script again. The agent will automatically handle registering your machine (if it's your first time), bringing it online, and managing jobs. You just leave it running to earn APT.",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex gap-4 group">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-chart-2/10 border border-chart-2/20 flex items-center justify-center font-bold text-chart-2 group-hover:bg-chart-2/20 transition-colors">
                    {step}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-semibold text-lg mb-2">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

function DeveloperGuide() {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Introduction */}
      <section>
        <h2 className="text-3xl font-bold mb-4">Protocol Integration Guide</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          The Unified Compute Protocol allows any developer or smart contract on Aptos to programmatically request and
          pay for off-chain computation. This enables powerful hybrid applications where on-chain logic can trigger
          complex off-chain tasks.
        </p>
      </section>

      {/* Core Concepts */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Core Concepts & Modules</h3>
        <div className="grid gap-6">
          {[
            {
              title: "Marketplace (marketplace.move)",
              description:
                "This module is the source of truth for the compute supply. It manages a single, permanent Listing resource for each host, tracking their hardware specs and real-time availability.",
              icon: Cpu,
              color: "chart-1",
            },
            {
              title: "Escrow (escrow.move)",
              description:
                "This is the financial heart of the protocol. It handles all payments, job creation, and manages the lifecycle of compute requests from renters. It acts as the main entry point for other contracts.",
              icon: Shield,
              color: "chart-2",
            },
            {
              title: "Reputation (reputation.move)",
              description:
                "This module provides a trust layer by tracking the performance history (completed jobs, total uptime) of each host.",
              icon: CheckCircle2,
              color: "chart-3",
            },
          ].map(({ title, description, icon: Icon, color }) => (
            <Card key={title} className="p-6 card-gradient border-border/50 hover:border-border transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${color}/10 border border-${color}/20 flex-shrink-0`}>
                  <Icon className={`w-5 h-5 text-${color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">{title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* API Reference */}
      <section>
        <h3 className="text-2xl font-bold mb-6">On-Chain API Reference</h3>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          To use our protocol, your smart contract will primarily interact with the{" "}
          <code className="px-2 py-1 rounded bg-muted text-foreground font-mono text-sm">escrow</code> module.
        </p>

        <div className="space-y-8">
          {/* Direct Rental */}
          <Card className="p-6 card-gradient border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <FileCode className="w-5 h-5 text-chart-1" />
              <h4 className="text-xl font-semibold">Direct Rental</h4>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
              <code className="text-foreground">
                escrow::rent_machine_direct(host_address: address, duration_seconds: u64)
              </code>
            </div>

            <p className="text-muted-foreground mb-4 leading-relaxed">
              Use this when your contract wants to rent a <em>specific</em> machine that is known to be available. This
              is a synchronous action.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <code className="px-2 py-1 rounded bg-muted text-foreground font-mono">renter: &signer</code>
                <span className="text-muted-foreground">
                  The account signing the transaction and paying for the rental.
                </span>
              </div>
              <div className="flex gap-2">
                <code className="px-2 py-1 rounded bg-muted text-foreground font-mono">host_address</code>
                <span className="text-muted-foreground">The address of the host machine you wish to rent.</span>
              </div>
              <div className="flex gap-2">
                <code className="px-2 py-1 rounded bg-muted text-foreground font-mono">duration_seconds</code>
                <span className="text-muted-foreground">The total time in seconds you are escrowing funds for.</span>
              </div>
            </div>
          </Card>

          {/* Request Compute */}
          <Card className="p-6 card-gradient border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-5 h-5 text-chart-2" />
              <h4 className="text-xl font-semibold">Requesting Compute (Asynchronous)</h4>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
              <code className="text-foreground">escrow::request_compute(...)</code>
            </div>

            <p className="text-muted-foreground mb-4 leading-relaxed">
              This is the most powerful feature. Your contract can submit a job request with minimum specifications and
              a maximum price. Any qualified host on the network can then accept and execute the job.
            </p>

            <p className="font-semibold mb-3">Arguments:</p>
            <div className="space-y-2 text-sm">
              {[
                { param: "requester: &signer", desc: "The account creating the request and escrowing funds." },
                { param: "container_image: String", desc: "The public Docker image to run (e.g., on Docker Hub)." },
                {
                  param: "has_input_data_uri / input_data_uri_string",
                  desc: "An optional URI pointing to input data for the job.",
                },
                { param: "min_cpu_cores: u64", desc: "The minimum CPU cores required." },
                { param: "min_ram_gb: u64", desc: "The minimum RAM in gigabytes required." },
                { param: "max_cost_per_second: u64", desc: "The maximum price in Octas/sec you are willing to pay." },
                { param: "max_duration_seconds: u64", desc: "The maximum duration for which you are escrowing funds." },
              ].map(({ param, desc }) => (
                <div key={param} className="flex flex-col gap-1 pb-2 border-b border-border/30 last:border-0">
                  <code className="px-2 py-1 rounded bg-muted text-foreground font-mono inline-block">{param}</code>
                  <span className="text-muted-foreground pl-2">{desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Example Code */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Example: A dApp Requesting Off-Chain Computation</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Imagine you have a dApp that needs to run a complex analysis on some data. Your dApp&apos;s smart contract can call
          our protocol to get the work done.
        </p>

        <Card className="p-0 card-gradient border-border/50 overflow-hidden">
          <div className="bg-muted/30 px-6 py-3 border-b border-border/50 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-chart-1" />
            <span className="font-mono text-sm">my_dapp.move</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed">
              <code className="text-foreground">{`module my_dapp::compute_task {
    use UnifiedCompute::escrow;
    use std::signer;
    use std::string::utf8;

    // This function is called by a user of our dApp.
    public entry fun process_my_data(user: &signer, data_uri: vector<u8>) {
        // Our dApp escrows the funds on behalf of the user.
        // We define the job requirements here.

        escrow::request_compute(
            user,
            utf8(b"my_username/my_analysis_container:latest"), // Our custom Docker image
            true,                                           // Yes, we have an input URI
            utf8(data_uri),                                 // The data to process
            16,                                             // Require at least 16 CPU cores
            32,                                             // Require at least 32 GB RAM
            500,                                            // Willing to pay up to 500 Octas/sec
            3600,                                           // Escrow funds for up to 1 hour
        );

        // Now, any host on the Unified Compute network that meets these
        // specs and price can accept and run our analysis job.
    }
}`}</code>
            </pre>
          </div>
        </Card>
      </section>
    </div>
  )
}
