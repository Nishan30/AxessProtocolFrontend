'use client';

import BillingMetrics from '@/components/BillingMetrics';
import SessionStats from '@/components/SessionStats';
import { useWalletStore } from '@/lib/use-wallet-store';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// TS helper for Petra
declare global {
    interface Window {
        petra?: any;
    }
}

// --- Types ---
interface Job {
    job_id: number;
    host_address: string;
    listing_id: number;
    is_active: boolean;
}

interface GpuStats {
    gpu_utilization_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
}

interface SessionDetails {
    status?: 'ready' | 'pending' | string;
    public_url: string | null;
    token: string | null;
    stats: GpuStats | null;
    price_per_second: number;
    uptime_seconds: number;
    current_cost_octas: number;
    error?: string | null;
}

type PollKind = 'pending' | 'ready';

const RenterDashboard = () => {
    const { account, setAccount } = useWalletStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<Record<number, SessionDetails | null>>({});
    const [walletDetected, setWalletDetected] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000/api/v1';

    // Detect Petra
    useEffect(() => {
        setWalletDetected(typeof window !== 'undefined' && 'petra' in window);
    }, []);

    // Connect / disconnect wallet
    const connectWallet = async () => {
        if (!walletDetected || !window.petra) return;
        try {
            const walletAccount = await window.petra.connect();
            setAccount(walletAccount);
            console.log('Connected account:', walletAccount);
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setAccount(null);
        }
    };

    const disconnectWallet = async () => {
        try {
            if (account && window.petra?.disconnect) {
                await window.petra.disconnect();
            }
        } finally {
            setAccount(null);
        }
    };

    // Fetch renter jobs
    useEffect(() => {
        const fetchRenterJobs = async () => {
            if (!account?.address) {
                setJobs([]);
                return;
            }
            setIsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/renters/${account.address}/jobs`);
                if (!res.ok) throw new Error(`Failed to fetch jobs (${res.status})`);
                const data: Job[] = await res.json();
                setJobs(data);
            } catch (e) {
                console.error('Error fetching renter jobs:', e);
                setJobs([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRenterJobs();
    }, [account, API_BASE]);

    // Polling management (use timeouts so we can vary delay)
    const pollTimersRef = useRef<Record<number, number>>({});
    const pollDelaysRef = useRef<Record<number, number>>({});
    const pageVisibleRef = useRef<boolean>(true);

    useEffect(() => {
        const handler = () => {
            pageVisibleRef.current = document.visibilityState === 'visible';
        };
        document.addEventListener('visibilitychange', handler);
        pageVisibleRef.current = document.visibilityState === 'visible';
        return () => document.removeEventListener('visibilitychange', handler);
    }, []);

    const clearPoll = (jobId: number) => {
        const t = pollTimersRef.current[jobId];
        if (t) {
            clearTimeout(t);
            delete pollTimersRef.current[jobId];
        }
    };

    const scheduleNext = (jobId: number, delayMs: number, kind: PollKind) => {
        pollDelaysRef.current[jobId] = delayMs;
        clearPoll(jobId);
        const id = window.setTimeout(() => pollOnce(jobId, kind), delayMs);
        pollTimersRef.current[jobId] = id;
    };

    const buildNotebookUrl = (sd: SessionDetails) => {
        if (!sd?.public_url || !sd?.token) return '#';
        const base = sd.public_url.replace(/\/$/, '');
        return `${base}/tree?token=${encodeURIComponent(sd.token)}`;
    };

    const pollOnce = async (jobId: number, kind: PollKind) => {
        // If tab is hidden, reschedule the same delay without fetching
        if (!pageVisibleRef.current) {
            const lastDelay = pollDelaysRef.current[jobId] ?? (kind === 'ready' ? 10000 : 3000);
            scheduleNext(jobId, lastDelay, kind);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}/session`);
            const retryAfterHeader = res.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : 0;

            if (res.status === 200) {
                const payload = (await res.json()) as SessionDetails;
                setSessionDetails(prev => ({ ...prev, [jobId]: payload }));

                const readyNow =
                    payload?.status === 'ready' &&
                    !!payload?.public_url &&
                    !!payload?.token &&
                    !payload?.error;

                // Once ready, poll slower (10s) to update stats/billing
                if (readyNow) {
                    scheduleNext(jobId, 10000, 'ready');
                } else {
                    // Not fully ready or transient error; keep pending cadence with mild backoff
                    const lastDelay = pollDelaysRef.current[jobId] ?? 3000;
                    const nextDelay = Math.min(10000, Math.max(3000, Math.floor(lastDelay * 1.3)));
                    scheduleNext(jobId, nextDelay, 'pending');
                }
            } else if (res.status === 202) {
                // Pending on server side; obey Retry-After if provided, else backoff up to 10s
                const lastDelay = pollDelaysRef.current[jobId] ?? 3000;
                const nextDelay = retryAfter > 0 ? retryAfter * 1000 : Math.min(10000, Math.max(3000, Math.floor(lastDelay * 1.5)));
                scheduleNext(jobId, nextDelay, 'pending');
            } else if (res.status === 404) {
                // Not found yet; keep trying on a fixed cadence
                scheduleNext(jobId, 5000, 'pending');
            } else {
                // Unexpected; try again later
                scheduleNext(jobId, 8000, kind);
            }
        } catch (e) {
            console.error('Polling error:', e);
            // Network/transient error -> retry with backoff
            const lastDelay = pollDelaysRef.current[jobId] ?? 3000;
            const nextDelay = Math.min(12000, Math.max(3000, Math.floor(lastDelay * 1.7)));
            scheduleNext(jobId, nextDelay, kind);
        }
    };

    // Start session & begin polling (no recursive /start calls)
    const handleStartJob = async (jobId: number) => {
        try {
            const res = await fetch(`${API_BASE}/jobs/${jobId}/start`, { method: 'POST' });

            if (res.status === 200) {
                // Backend may return "already_running" with details
                const payload = (await res.json()) as SessionDetails & { status?: string };
                if (payload?.status === 'already_running' && payload.public_url && payload.token) {
                    setSessionDetails(prev => ({ ...prev, [jobId]: payload }));
                    // Start slow polling as it's already ready
                    scheduleNext(jobId, 10000, 'ready');
                    return;
                }
            }

            alert('Start command issued! Waiting for session to become ready...');

            // Begin pending polling (3s cadence, with adaptive backoff)
            scheduleNext(jobId, 3000, 'pending');
        } catch (error) {
            console.error('Failed to start job:', error);
            alert('Failed to issue start command.');
        }
    };

    // Stop session & stop polling
    const handleStopJob = async (jobId: number) => {
        if (!confirm(`Are you sure you want to stop job ${jobId}?`)) return;

        clearPoll(jobId);

        try {
            const response = await fetch(`${API_BASE}/jobs/${jobId}/stop`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error ${response.status}`);
            }
            alert(`Stop command issued for job ${jobId}.`);
            setSessionDetails(prev => ({ ...prev, [jobId]: null }));
        } catch (error) {
            console.error('Failed to stop job:', error);
            alert(`Failed to issue stop command: ${error}`);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(pollTimersRef.current).forEach(clearTimeout);
            pollTimersRef.current = {};
            pollDelaysRef.current = {};
        };
    }, []);

    const activeJobs = jobs.filter(j => j.is_active);
    const completedJobs = jobs.filter(j => !j.is_active);

    return (
        <main className="container mx-auto p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-bold">Renter Dashboard</h1>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        &larr; Back to Marketplace
                    </Link>
                    {!account ? (
                        <button
                            onClick={connectWallet}
                            disabled={!walletDetected}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
                        >
                            {walletDetected ? 'Connect Petra Wallet' : 'Petra Not Found'}
                        </button>
                    ) : (
                        <button
                            onClick={disconnectWallet}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {!account ? (
                <div className="text-center bg-slate-800 p-10 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-slate-400">Please connect your wallet to view your active and past rentals.</p>
                </div>
            ) : (
                <div>
                    {/* Active Rentals */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-600 pb-2">Active Rentals</h2>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : activeJobs.length > 0 ? (
                            <div className="space-y-4">
                                {activeJobs.map(job => {
                                    const sd = sessionDetails[job.job_id] || undefined;
                                    const isReady =
                                        !!sd &&
                                        !sd.error &&
                                        !!sd.public_url &&
                                        !!sd.token &&
                                        (sd.status ?? 'ready') === 'ready';

                                    return (
                                        <div key={job.job_id} className="bg-gray-800 p-4 rounded-lg">
                                            <h2 className="font-bold text-lg">Job ID: {job.job_id}</h2>
                                            <p className="font-mono text-sm">Host: {job.host_address}</p>

                                            <div className="mt-4 flex gap-4">
                                                <button
                                                    onClick={() => handleStartJob(job.job_id)}
                                                    disabled={isReady}
                                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded"
                                                >
                                                    {isReady ? 'Running' : 'Start Session'}
                                                </button>
                                                <button
                                                    onClick={() => handleStopJob(job.job_id)}
                                                    disabled={!isReady}
                                                    className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded"
                                                >
                                                    Stop Session
                                                </button>
                                                {isReady && (
                                                    <a
                                                        href={buildNotebookUrl(sd)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
                                                    >
                                                        Launch AI Notebook
                                                    </a>
                                                )}
                                            </div>

                                            {sd?.error && (
                                                <div className="mt-4 p-3 rounded bg-amber-900 text-amber-100 border border-amber-700">
                                                    Session error: {sd.error}
                                                </div>
                                            )}

                                            {isReady && (
                                                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-lg">Session Ready!</h3>
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
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400">You have no active rentals.</p>
                        )}
                    </div>

                    {/* Rental History */}
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-4 border-b border-gray-600 pb-2">Rental History</h2>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : completedJobs.length > 0 ? (
                            <div className="space-y-3">
                                {completedJobs.map(job => (
                                    <div
                                        key={job.job_id}
                                        className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center"
                                    >
                                        <div>
                                            <h3 className="font-semibold">Job ID: {job.job_id}</h3>
                                            <p className="font-mono text-xs text-gray-500">Host: {job.host_address}</p>
                                        </div>
                                        <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
                                            Completed
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">You have no past rentals.</p>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
};

export default RenterDashboard;
