'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/lib/use-wallet-store';

// --- Type Definitions (copied from your main page for consistency) ---
interface AccountInfo {
  address: string;
  publicKey: string;
}

interface HostListing {
  id: number;
  host_address: string;
  is_available: boolean;
  price_per_second: number;
  physical: {
      gpu_model: string;
      cpu_cores: number;
      ram_gb: number;
  } | null;
  cloud: {
      provider: string;
      instance_id: string;
      instance_type: string;
      region: string;
  } | null;
}

// --- Component ---
const HostDashboard = () => {
  // --- 1. ADDED: Wallet State Management (copied from your main page) ---
  const { account, setAccount } = useWalletStore();
  const [walletDetected, setWalletDetected] = useState(false);
  
  const [listings, setListings] = useState<HostListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1";
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0xd144f994fb413c68308e64805774d17ec9703cb4e125dfe19e655ffe209d18b4";

  // --- 2. ADDED: Wallet Detection and Connection Logic (copied from your main page) ---
  useEffect(() => {
    // Petra wallet injects itself into the window object
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

  // This data fetching logic now works perfectly with the local `account` state
  useEffect(() => {
    if (account?.address) {
      const fetchHostListings = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`${API_BASE}/hosts/${account.address}/listings`);
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `Failed to fetch listings (HTTP ${response.status})`);
          }
          const data: HostListing[] = await response.json();
          setListings(data);
        } catch (err: any) {
          console.error("Failed to fetch host listings:", err);
          setError(err.message);
          setListings([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHostListings();
    } else {
      // If the user disconnects, clear the listings
      setListings([]);
    }
  }, [account, API_BASE]);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-slate-900 text-white">
      <div className="w-full max-w-6xl">
        {/* --- 3. ADDED: Header with Wallet Button (modeled on your main page) --- */}
        <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-bold">Host Dashboard</h1>
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

        {/* This conditional rendering now works perfectly */}
        {!account ? (
             <div className="text-center bg-slate-800 p-10 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-slate-400">Please connect your wallet to manage your listings or become a host.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Listings Display */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Your On-Chain Listings</h2>
              {isLoading && <div className="text-center p-4">Loading your listings...</div>}
              {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg">Error: {error}</div>}
              
              {!isLoading && !error && listings.length === 0 && (
                <div className="bg-gray-800 p-6 rounded-lg text-center border border-dashed border-gray-600">
                    <h3 className="text-lg font-semibold">No listings found for your address.</h3>
                    <p className="text-gray-400 mt-2">Follow the instructions to run the Host Agent and list your machine!</p>
                </div>
              )}

              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-gray-700/50">
                    <div>
                      <p className="font-bold text-lg">{listing.physical?.gpu_model || 'Unknown Machine'}</p>
                      <p className="text-sm text-gray-400 font-mono">Listing ID: {listing.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      listing.is_available ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {listing.is_available ? 'Available' : 'Rented'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Agent Instructions */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Become a Host</h2>
              <div className="bg-gray-800 p-6 rounded-lg space-y-4 border border-gray-700 sticky top-24">
                <h3 className="font-bold text-lg">One-Step Agent Setup</h3>
                <p className="text-sm text-gray-300">Run our Python agent on your machine to list it on the marketplace.</p>
                <div>
                  <label className="font-mono text-xs mb-1 block text-gray-400">1. Create a `.env` file:</label>
                  <pre className="bg-gray-900 p-3 rounded-md text-xs overflow-x-auto text-slate-300">{`HOST_PRIVATE_KEY=YOUR_HOST_WALLET_PRIVATE_KEY\nCONTRACT_ADDRESS=${CONTRACT_ADDRESS}`}</pre>
                </div>
                <div>
                  <label className="font-mono text-xs mb-1 block text-gray-400">2. Install dependencies:</label>
                  <pre className="bg-gray-900 p-3 rounded-md text-xs overflow-x-auto text-slate-300">pip install aptos-sdk python-dotenv psutil docker</pre>
                </div>
                 <div>
                  <label className="font-mono text-xs mb-1 block text-gray-400">3. Run the agent:</label>
                  <pre className="bg-gray-900 p-3 rounded-md text-xs overflow-x-auto text-slate-300">python agent.py</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default HostDashboard;