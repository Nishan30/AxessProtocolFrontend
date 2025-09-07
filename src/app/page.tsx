// File: src/app/page.tsx
"use client";

import { useWalletStore } from "@/lib/use-wallet-store";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import Link from 'next/link'; // Import Link for the "Become a Host" button
import { useEffect, useState } from "react";

// --- UPDATED: Define a more specific type for our Listing data ---
interface ReputationScore {
    completed_jobs: number;
    total_uptime_seconds: number;
}

interface Listing {
    id: number;
    host_address: string;
    listing_type: string;
    price_per_second: number;
    is_available: boolean;
    physical?: { gpu_model: string };
    cloud?: { instance_type: string };
    reputation?: ReputationScore; // Reputation is optional
}

type AccountInfo = {
  address: string;
  publicKey: string;
};

// IMPORTANT: Replace this with your actual deployed contract address
const CONTRACT_ADDRESS = "0x13a2c0f46951e8462d6147bccacf163a61b4cb03b4e44f179d4621fd2468ca0a";

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

// --- Component ---
export default function Home() {
  const { account, setAccount } = useWalletStore();
  const [walletDetected, setWalletDetected] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  // --- NEW STATE for the Rent Modal ---
  const [listingToRent, setListingToRent] = useState<any | null>(null);
  const [rentalDuration, setRentalDuration] = useState(10); // Default 10 minutes
  const [isRenting, setIsRenting] = useState(false); // For transaction loading state

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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadListings(cursor: number | null = null, append = false) {
    try {
        if (cursor) setLoadingMore(true);
        else setIsLoading(true);
        const limit = 20;
        const url = `${API_BASE}/listings?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        // --- NEW: Enrich each listing with its reputation score ---
        const listingsWithReputation = await Promise.all(
            (data.items ?? []).map(async (listing: Listing) => {
                try {
                    const repRes = await fetch(`${API_BASE}/reputation/${listing.host_address}`);
                    if (repRes.ok) {
                        const reputation = await repRes.json();
                        // Only add reputation if it's not null
                        if (reputation) {
                           return { ...listing, reputation };
                        }
                    }
                } catch (e) { console.error(`Failed to fetch reputation for ${listing.host_address}`, e); }
                return listing; // Return original listing if reputation fetch fails or is null
            })
        );
        
        setNextCursor(data.next_cursor ?? null);
        setTotal(typeof data.total === "number" ? data.total : null);
        if (append) setListings((s) => [...s, ...listingsWithReputation]);
        else setListings(listingsWithReputation);
    } catch (err: any) {
        console.error("Failed to fetch listings:", err);
        setError(err?.message ?? String(err));
    } finally {
        setIsLoading(false);
        setLoadingMore(false);
    }
  }

  async function fetchListingDetail(host: string, id: number) {
    // ... (this function is correct, no changes needed)
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/listings/${host}/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedListing(data);
    } catch (err: any) {
      console.error("Failed to fetch listing detail:", err);
      setError(err?.message ?? String(err));
    } finally {
      setIsLoading(false);
    }
  }

  // --- NEW FUNCTION to handle the rent transaction ---
  const handleRent = async () => {
    if (!account || !listingToRent || !window.petra) {
      setError("Please connect your wallet and select a listing to rent.");
      return;
    }
    if (rentalDuration <= 0) {
      setError("Rental duration must be greater than 0.");
      return;
    }

    setIsRenting(true);
    setError(null);

    const durationInSeconds = rentalDuration * 60;

    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::rent_machine`,
      type_arguments: [],
      arguments: [
        listingToRent.host_address,
        listingToRent.id.toString(),
        durationInSeconds.toString(),
      ],
    };

    try {
      // The flow is now much simpler. We just submit and wait.
      const response = await window.petra.signAndSubmitTransaction(payload);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      // --- NO MORE localStorage LOGIC ---
      // The on-chain contract handles remembering the job for us.
      
      alert(`Rental successful! Transaction: ${response.hash}`);
      setListingToRent(null); // Close modal on success
      loadListings(); // Refresh the list to show the new state

    } catch (err: any) {
      console.error("Rental failed:", err);
      setError(err?.message ?? "An unknown error occurred during the transaction.");
    } finally {
      setIsRenting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-slate-900 text-white">
      {/* Header and Wallet Button (no changes) */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-2xl md:text-4xl font-bold">Aptos Compute Marketplace</h1>
        <div className="flex items-center gap-4">
          <Link href="/host" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Become a Host
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

      {account && (
        <div className="w-full max-w-5xl mb-8 p-4 bg-slate-800 rounded-lg text-center">
          <p>Connected Address: <span className="font-mono text-sm">{account.address}</span></p>
        </div>
      )}

      {/* Main content area */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl mb-4">Available Machines</h2>
        {error && <div className="mb-4 p-3 bg-red-700 rounded">Error: {error}</div>}
        {isLoading && !loadingMore ? <p>Loading listings...</p> : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing: any) => (
              <div key={`${listing.host_address}-${listing.id}`} className="p-4 bg-gray-800 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm md:text-base break-words">
                  <div><strong>ID:</strong> {listing.id}</div>
                  <div><strong>Host:</strong> <span className="font-mono">{listing.host_address}</span></div>
                  <div><strong>Type:</strong> {listing.listing_type} ({listing.physical?.gpu_model || listing.cloud?.instance_type})</div>
                  <div><strong>Price/s:</strong> {listing.price_per_second} Octas</div>
                  <div className={listing.is_available ? 'text-green-400' : 'text-red-400'}>
                    <strong>Available:</strong> {String(listing.is_available)}
                  </div>
                  {/* --- NEW: Display Reputation --- */}
                  {listing.reputation && (
                    <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                        <span className="font-semibold">Host Reputation:</span>
                        <span className="ml-2">✅ {listing.reputation.completed_jobs} Jobs</span>
                        <span className="ml-3">⏱️ {Math.round(listing.reputation.total_uptime_seconds / 60)} min Uptime</span>
                    </div>
                  )}
                </div>
                {/* --- UPDATED BUTTONS for each listing --- */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => fetchListingDetail(listing.host_address, listing.id)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-1 px-3 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setListingToRent(listing)}
                    disabled={!listing.is_available || !account}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1 px-3 rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Rent
                  </button>
                </div>
              </div>
            ))}
            {/* Load more button (no changes) */}
            {nextCursor !== null && (listings.length < (total ?? Infinity)) && (
              <div className="text-center">
                <button disabled={loadingMore} onClick={() => loadListings(nextCursor, true)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded">
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>No listings found. A host needs to run the oracle to list a machine.</p>
        )}
      </div>

      {/* Listing detail modal (no changes) */}
      {selectedListing && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-20">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSelectedListing(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-slate-800 p-6 rounded">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">Listing {selectedListing.id}</h3>
              <button onClick={() => setSelectedListing(null)} className="text-white bg-red-600 px-3 py-1 rounded">Close</button>
            </div>
            <div className="mt-4 overflow-auto max-h-[60vh]">
              <pre className="text-sm bg-gray-900 p-4 rounded">{JSON.stringify(selectedListing, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW Rent Modal --- */}
      {listingToRent && (
        <div className="fixed inset-0 flex items-center justify-center p-6 z-30">
          <div className="absolute inset-0 bg-black opacity-60" onClick={() => !isRenting && setListingToRent(null)} />
          <div className="relative z-10 w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Rent Machine</h3>
            <div className="mb-4 text-sm">
              <p><strong>Host:</strong> <span className="font-mono">{listingToRent.host_address}</span></p>
              <p><strong>ID:</strong> {listingToRent.id}</p>
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
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 font-bold disabled:bg-cyan-800 disabled:cursor-wait"
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