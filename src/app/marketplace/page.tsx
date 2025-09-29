"use client";

import { useWalletStore } from "@/lib/use-wallet-store";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import Link from 'next/link';
import { useEffect, useState } from "react";
import TransactionStatus, { TransactionState } from '@/components/TransactionStatus';

// --- Defines the shape of the Listing object returned by our backend API ---
interface ReputationScore {
    completed_jobs: number;
    total_uptime_seconds: number;
}

interface Listing {
    host_address: string;
    listing_type: string;
    price_per_second: number;
    is_available: boolean;
    is_rented: boolean;
    active_job_id: number | null;
    physical?: { 
        gpu_model: string;
        cpu_cores: number;
        ram_gb: number;
    };
    cloud?: { 
        instance_type: string;
    };
    reputation?: ReputationScore;
}

// --- Defines the shape of the wallet account info ---
type AccountInfo = {
  address: string;
  publicKey: string;
};

// --- CONFIGURATION ---
// IMPORTANT: Replace this with your LATEST deployed contract address
const CONTRACT_ADDRESS = "0x13a2c0f46951e8462d6147bccacf163a61b4cb03b4e44f179d4621fd2468ca0a"; // Example address

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

// --- MAIN COMPONENT ---
export default function MarketplacePage() {
  // State from our global Zustand store for wallet info
  const { account, setAccount } = useWalletStore();

  // Local component state
  const [walletDetected, setWalletDetected] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>({ status: 'idle' });
  
  // State for the rental modal
  const [listingToRent, setListingToRent] = useState<Listing | null>(null);
  const [rentalDuration, setRentalDuration] = useState(10); // Default 10 minutes
  const [isRenting, setIsRenting] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1";

  // --- WALLET CONNECTION LOGIC ---
  useEffect(() => {
    if ("petra" in window) {
      setWalletDetected(true);
    }
  }, []);

  const connectWallet = async () => {
    if (!walletDetected || !window.petra) return;
    try {
      const walletAccount = await window.petra.connect();
      setAccount(walletAccount);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setAccount(null);
    }
  };

  const disconnectWallet = async () => {
    if (account && window.petra?.disconnect) {
      await window.petra?.disconnect();
      setAccount(null);
    }
  };

  // --- DATA FETCHING LOGIC ---
  const loadListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const url = `${API_BASE}/listings`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch listings: HTTP ${res.status}`);
        
        const data = await res.json();
        
        // Enrich each listing with its on-chain reputation score
        const listingsWithReputation = await Promise.all(
            (data.items ?? []).map(async (listing: Listing) => {
                try {
                    const repRes = await fetch(`${API_BASE}/reputation/${listing.host_address}`);
                    if (repRes.ok) {
                        const reputation = await repRes.json();
                        if (reputation) {
                           return { ...listing, reputation };
                        }
                    }
                } catch (e) { 
                    console.error(`Failed to fetch reputation for ${listing.host_address}`, e); 
                }
                return listing;
            })
        );
        
        setListings(listingsWithReputation);
    } catch (err: any) {
        setError(err.message ?? "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  }

  // Effect to load listings when the component mounts
  useEffect(() => {
    loadListings();
  }, []);

  // --- TRANSACTION HANDLER ---
  const handleRent = async () => {
    if (!account || !listingToRent || !window.petra) {
      setError("Please connect your wallet and select a listing to rent.");
      return;
    }
    if (rentalDuration <= 0) {
      setError("Rental duration must be greater than 0 minutes.");
      return;
    }

    setIsRenting(true);
    setTransactionState({ status: 'processing' });
    
    const durationInSeconds = rentalDuration * 60;

    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::rent_machine_direct`,
      type_arguments: [],
      arguments: [
        listingToRent.host_address,
        durationInSeconds.toString(),
      ],
    };

    try {
      const response = await window.petra.signAndSubmitTransaction(payload);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      setTransactionState({ status: 'success', hash: response.hash });
      alert(`Rental successful!`);
      setListingToRent(null);
      // Refresh the list to show the new "is_rented" status
      loadListings();

    } catch (err: any) {
      console.error("Rental failed:", err);
      setTransactionState({ status: 'error', message: err.message });
    } finally {
      setIsRenting(false);
      setTimeout(() => setTransactionState({ status: 'idle' }), 10000);
    }
  };

  // --- RENDER ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-slate-900 text-white">
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
                <h1 className="text-2xl md:text-4xl font-bold">GPU Marketplace</h1>
                <div className="flex items-center gap-4">
                    {/* Link back to the new homepage */}
                    <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        &larr; Home
                    </Link>
                    <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                        My Dashboard
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
      
      {/* Main Content */}
      <div className="w-full max-w-4xl">
        <TransactionStatus state={transactionState} onClear={() => setTransactionState({ status: 'idle' })} />
        <h2 className="text-2xl mb-4">Online Machines</h2>
        
        {error && <div className="mb-4 p-3 bg-red-800 text-red-200 rounded text-center">Error: {error}</div>}

        {isLoading ? (
            <p className="text-center text-gray-400">Loading online hosts...</p>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing: Listing) => (
              <div key={listing.host_address} className="p-4 bg-gray-800 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-grow text-sm md:text-base break-words">
                        <div className="truncate font-mono text-xs text-gray-400">Host: {listing.host_address}</div>
                        <div className="font-bold text-lg mt-1">{listing.physical?.gpu_model || 'Cloud Instance'}</div>
                        <div>Price: {listing.price_per_second} Octas/sec</div>
                        
                        <div className="mt-2">
                            {listing.is_available && !listing.is_rented ? (
                                <span className="px-2 py-1 text-xs font-semibold text-green-200 bg-green-500/20 rounded-full">Available</span>
                            ) : (
                                <span className="px-2 py-1 text-xs font-semibold text-yellow-200 bg-yellow-500/20 rounded-full">
                                    {listing.is_rented ? 'Rented' : 'Offline'}
                                </span>
                            )}
                        </div>

                        {listing.reputation && (
                            <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                                <span className="font-semibold">Reputation:</span>
                                <span className="ml-2">✅ {listing.reputation.completed_jobs} Jobs</span>
                                <span className="ml-3">⏱️ {Math.round(listing.reputation.total_uptime_seconds / 60)} min Uptime</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                        <button
                            onClick={() => setListingToRent(listing)}
                            disabled={!listing.is_available || listing.is_rented || !account}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Rent
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center p-8 bg-gray-800 rounded-md">
              No hosts are currently online.
          </p>
        )}
      </div>

      {/* Rent Modal */}
      {listingToRent && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-30">
          <div className="absolute inset-0 bg-black opacity-60" onClick={() => !isRenting && setListingToRent(null)} />
          <div className="relative z-10 w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Rent Machine</h3>
            <div className="mb-4 text-sm">
              <p><strong>Host:</strong> <span className="font-mono">{listingToRent.host_address}</span></p>
              <p><strong>GPU:</strong> {listingToRent.physical?.gpu_model}</p>
            </div>
            <div className="mb-6">
              <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-2">
                Rental Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                value={rentalDuration}
                onChange={(e) => setRentalDuration(Math.max(1, Number(e.target.value)))}
                className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-cyan-500"
                min="1"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setListingToRent(null)}
                disabled={isRenting}
                className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-500 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRent}
                disabled={isRenting}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 font-bold disabled:bg-cyan-800 disabled:cursor-wait w-48"
              >
                {isRenting ? "Processing..." : `Confirm for ${listingToRent.price_per_second * rentalDuration * 60} Octas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}