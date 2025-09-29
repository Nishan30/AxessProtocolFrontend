"use client";

import { useState } from 'react';
import Link from 'next/link';

const DocsPage = () => {
    // State to manage which tab is currently active
    const [activeTab, setActiveTab] = useState('user');

    return (
        <main className="flex min-h-screen flex-col items-center p-8 md:p-16 bg-slate-900 text-white">
            <div className="w-full max-w-4xl">
                {/* Header and Navigation */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">Documentation</h1>
                    <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        &larr; Back to Marketplace
                    </Link>
                </div>

                {/* Tabbed Navigation */}
                <div className="flex border-b border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`py-2 px-4 text-lg font-semibold transition-colors ${
                            activeTab === 'user'
                                ? 'border-b-2 border-cyan-400 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        User Guide
                    </button>
                    <button
                        onClick={() => setActiveTab('developer')}
                        className={`py-2 px-4 text-lg font-semibold transition-colors ${
                            activeTab === 'developer'
                                ? 'border-b-2 border-cyan-400 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Developer Protocol
                    </button>
                </div>

                {/* Content Area */}
                {/* 
                    Using the Tailwind Typography plugin classes for nice default styling.
                    - prose: base class
                    - prose-invert: for dark mode
                    - prose-lg: for a larger font size
                    - max-w-none: to override the default max-width of prose
                */}
                <div className="prose prose-invert prose-lg max-w-none">
                    {/* User Guide Content */}
                    {activeTab === 'user' && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2>Getting Started Guide</h2>
                                <p>Welcome to the Unified Compute Marketplace! This guide will help you get started as either a Renter or a Host.</p>
                            </section>

                            <section>
                                <h3>For Renters: Using a GPU</h3>
                                <p>Renting a GPU for your AI/ML tasks is a simple, five-step process:</p>
                                <ol>
                                    <li><strong>Connect Your Wallet:</strong> Visit the marketplace and connect your Petra wallet. Ensure you have Testnet APT for payments.</li>
                                    <li><strong>Rent a Machine:</strong> Browse the list of online hosts. Look at their reputation and GPU specs, then click "Rent", choose your duration, and approve the transaction.</li>
                                    <li><strong>Go to Your Dashboard:</strong> Navigate to the "Renter Dashboard" to manage your active rentals.</li>
                                    <li><strong>Start Your Session:</strong> Click "Start Session". The system will securely prepare a Jupyter Notebook for you on the host's machine. A "Launch AI Notebook" button will appear.</li>
                                    <li><strong>Run Your Job:</strong> Click "Launch", connect with the provided token, upload your Python scripts (like our `train.py` demo), and run your computation. You can monitor live GPU and billing stats directly from your dashboard.</li>
                                </ol>
                            </section>
                            
                            <section>
                                <h3>For Hosts: Providing a GPU</h3>
                                <p>Our goal is to make hosting as simple as possible. You will use our secure, one-step Host Agent software to connect your machine to the network.</p>
                                 <ol>
                                    <li><strong>Download the Agent:</strong> Get the latest version from our GitHub Releases page.</li>
                                    <li><strong>Configure:</strong> Run the setup script, which will create a `config.ini` file. Edit this file with your Aptos private key and ngrok authtoken.</li>
                                    <li><strong>Go Online:</strong> Run the same script again. The agent will automatically handle registering your machine (if it's your first time), bringing it online, and managing jobs. You just leave it running to earn APT.</li>
                                </ol>
                            </section>
                        </div>
                    )}

                    {/* Developer Guide Content */}
                    {activeTab === 'developer' && (
                         <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2>Protocol Integration Guide</h2>
                                <p>
                                    The Unified Compute Protocol allows any developer or smart contract on Aptos to programmatically request and pay for off-chain computation. This enables powerful hybrid applications where on-chain logic can trigger complex off-chain tasks.
                                </p>
                            </section>

                            <section>
                                <h3>Core Concepts & Modules</h3>
                                <ul>
                                    <li><strong>Marketplace (`marketplace.move`):</strong> This module is the source of truth for the compute supply. It manages a single, permanent `Listing` resource for each host, tracking their hardware specs and real-time availability.</li>
                                    <li><strong>Escrow (`escrow.move`):</strong> This is the financial heart of the protocol. It handles all payments, job creation, and manages the lifecycle of compute requests from renters. It acts as the main entry point for other contracts.</li>
                                    <li><strong>Reputation (`reputation.move`):</strong> This module provides a trust layer by tracking the performance history (completed jobs, total uptime) of each host.</li>
                                </ul>
                            </section>

                            <section>
                                <h3>On-Chain API Reference</h3>
                                <p>To use our protocol, your smart contract will primarily interact with the `escrow` module.</p>
                                
                                <div className="mt-4 space-y-6">
                                    <div>
                                        <h4>Direct Rental</h4>
                                        <pre><code>escrow::rent_machine_direct(host_address: address, duration_seconds: u64)</code></pre>
                                        <p>Use this when your contract wants to rent a *specific* machine that is known to be available. This is a synchronous action.</p>
                                        <ul>
                                            <li><code>renter: &signer</code>: The account signing the transaction and paying for the rental.</li>
                                            <li><code>host_address</code>: The address of the host machine you wish to rent.</li>
                                            <li><code>duration_seconds</code>: The total time in seconds you are escrowing funds for.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4>Requesting Compute (Asynchronous)</h4>
                                        <pre><code>escrow::request_compute(...)</code></pre>
                                        <p>This is the most powerful feature. Your contract can submit a job request with minimum specifications and a maximum price. Any qualified host on the network can then accept and execute the job.</p>
                                        <p className="font-bold mt-2">Arguments:</p>
                                        <ul>
                                            <li><code>requester: &signer</code>: The account creating the request and escrowing funds.</li>
                                            <li><code>container_image: String</code>: The public Docker image to run (e.g., on Docker Hub).</li>
                                            <li><code>has_input_data_uri / input_data_uri_string</code>: An optional URI pointing to input data for the job.</li>
                                            <li><code>min_cpu_cores: u64</code>: The minimum CPU cores required.</li>
                                            <li><code>min_ram_gb: u64</code>: The minimum RAM in gigabytes required.</li>
                                            <li><code>max_cost_per_second: u64</code>: The maximum price in Octas/sec you are willing to pay.</li>
                                            <li><code>max_duration_seconds: u64</code>: The maximum duration for which you are escrowing funds.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3>Example: A dApp Requesting Off-Chain Computation</h3>
                                <p>Imagine you have a dApp that needs to run a complex analysis on some data. Your dApp's smart contract can call our protocol to get the work done.</p>
                                <pre>
                                    <code>
{`module my_dapp::compute_task {
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
}`}
                                    </code>
                                </pre>
                            </section>
                         </div>
                    )}
                </div>
            </div>
            
            {/* Simple animation style */}
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
};

export default DocsPage;