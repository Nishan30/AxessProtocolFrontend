'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/lib/use-wallet-store';
import Link from 'next/link';

// --- Types ---
interface AccountInfo {
  address: string;
  publicKey: string;
}

interface Job {
  job_id: number;
  host_address: string;
  listing_id: number;
  is_active: boolean; // Assuming you've added this from our last discussion
}

interface SessionDetails {
    host_ip: string;
    port: number;
    token: string;
}

const RenterDashboard = () => {
    const { account, setAccount } = useWalletStore(); // Get setAccount from the store
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<Record<number, SessionDetails | null>>({});

    // --- 1. ADDED: State for wallet detection ---
    const [walletDetected, setWalletDetected] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1";

    // --- 2. ADDED: Logic to detect Petra wallet on page load ---
    useEffect(() => {
        if ("petra" in window) {
            setWalletDetected(true);
        }
    }, []);

    // --- 3. ADDED: Wallet connect and disconnect functions ---
    const connectWallet = async () => {
        if (!walletDetected || !window.petra) return;
        try {
            const walletAccount = await window.petra.connect();
            setAccount(walletAccount); // This updates the shared store
            console.log("Connected account:", walletAccount);
        } catch (err: any) {
            console.error("Failed to connect wallet:", err);
            setAccount(null);
        }
    };

    const disconnectWallet = async () => {
        if (account && window.petra?.disconnect) {
            await window.petra?.disconnect();
            setAccount(null); // This updates the shared store
        }
    };

    // This data fetching logic now correctly depends on the shared account state
    useEffect(() => {
        if (account?.address) {
            const fetchRenterJobs = async () => {
                setIsLoading(true);
                try {
                    // Just one single, clean API call to your new endpoint!
                    const res = await fetch(`${API_BASE}/renters/${account.address}/jobs`);
                    
                    if (!res.ok) {
                        throw new Error("Failed to fetch jobs from the server.");
                    }
                    
                    const data: Job[] = await res.json();
                    setJobs(data);
                    
                } catch (error) {
                    console.error("Error fetching renter jobs:", error);
                    setJobs([]); // Clear jobs on error
                } finally {
                    setIsLoading(false);
                }
            };

            fetchRenterJobs();
        } else {
            // If user disconnects, clear their jobs
            setJobs([]);
        }
    }, [account, API_BASE]);

    const handleStartJob = async (jobId: number) => {
        try {
            await fetch(`${API_BASE}/jobs/${jobId}/start`, { method: 'POST' });
            alert("Start command issued! Polling for session details...");
            const interval = setInterval(async () => {
                const res = await fetch(`${API_BASE}/jobs/${jobId}/session`);
                if (res.ok) {
                    const data: SessionDetails = await res.json();
                    setSessionDetails(prev => ({ ...prev, [jobId]: data }));
                    clearInterval(interval);
                }
            }, 3000);
        } catch (error) {
            console.error("Failed to start job:", error);
            alert("Failed to issue start command.");
        }
    };

    const handleStopJob = async (jobId: number) => {
        if (!confirm(`Are you sure you want to stop job ${jobId}?`)) return;
        try {
            const response = await fetch(`${API_BASE}/jobs/${jobId}/stop`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }
            alert(`Stop command issued for job ${jobId}.`);
            setSessionDetails(prev => {
                const updatedDetails = { ...prev };
                updatedDetails[jobId] = null; 
                return updatedDetails;
            });
        } catch (error) {
            console.error("Failed to stop job:", error);
            alert(`Failed to issue stop command: ${error}`);
        }
    };

    return (
        <main className="container mx-auto p-8">
            {/* --- 4. ADDED: Header with wallet button and consistent layout --- */}
            <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-bold">Renter Dashboard</h1>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        &larr; Back to Marketplace
                    </Link>
                    {!account ? (
                        <button onClick={connectWallet} disabled={!walletDetected} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
                        {walletDetected ? "Connect Petra Wallet" : "Petra Not Found"}
                        </button>
                    ) : (
                        <button onClick={disconnectWallet} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        Disconnect
                        </button>
                    )}
                </div>
            </div>

            {/* --- 5. UPDATED: Main content area now correctly shows a prompt if not connected --- */}
            {!account ? (
                <div className="text-center bg-slate-800 p-10 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-slate-400">Please connect your wallet to view your active and past rentals.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {isLoading ? <p>Loading rentals...</p> : jobs.map(job => (
                        <div key={job.job_id} className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="font-bold text-lg">Job ID: {job.job_id}</h2>
                            <p className="font-mono text-sm">Host: {job.host_address}</p>

                            <div className="mt-4 flex gap-4">
                                <button 
                                    onClick={() => handleStartJob(job.job_id)}
                                    disabled={!!sessionDetails[job.job_id]} 
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {sessionDetails[job.job_id] ? 'Running' : 'Start Session'}
                                </button>
                                <button 
                                    onClick={() => handleStopJob(job.job_id)}
                                    disabled={!sessionDetails[job.job_id]} 
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    Stop Session
                                </button>
                            </div>

                            {sessionDetails[job.job_id] && (
                                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                                    <h3 className="font-semibold">Session Ready!</h3>
                                    <p className="font-mono text-sm mt-2">
                                        Jupyter URL: 
                                        <span className="text-cyan-400 ml-2">
                                            http://{sessionDetails[job.job_id]?.host_ip}:{sessionDetails[job.job_id]?.port}
                                        </span>
                                    </p>
                                    <p className="font-mono text-sm mt-1">
                                        Token:
                                        <span className="text-cyan-400 ml-2">
                                            {sessionDetails[job.job_id]?.token}
                                        </span>
                                    </p>
                                    <p className="text-xs text-yellow-400 mt-4">
                                        Warning: This directly exposes the host's IP. A secure proxy will be added in Week 7.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                    {jobs.length === 0 && !isLoading && (
                        <p className="text-gray-400">You have no active rentals.</p>
                    )}
                </div>
            )}
        </main>
    );
};

export default RenterDashboard;