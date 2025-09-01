// File: src/app/page.tsx
"use client";

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useEffect, useState } from "react";

type AccountInfo = {
  address: string;
  publicKey: string;
};

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

export default function Home() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [walletDetected, setWalletDetected] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

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

  // Base API URL for the backend. Read from NEXT_PUBLIC_API_BASE with a safe fallback.
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000/api/v1";

  // load first page on mount
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

      // Backend returns { items: [...], next_cursor: number|null, total: number }
      setNextCursor(data.next_cursor ?? null);
      setTotal(typeof data.total === "number" ? data.total : null);

      if (append) setListings((s) => [...s, ...(data.items ?? [])]);
      else setListings(data.items ?? []);
    } catch (err: any) {
      console.error("Failed to fetch listings:", err);
      setError(err?.message ?? String(err));
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }

  async function fetchListingDetail(host: string, id: number) {
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

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-slate-900 text-white">
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-2xl md:text-4xl font-bold">
          Aptos Unified Compute Marketplace
        </h1>
        <div>
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={!walletDetected}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
            >
              {walletDetected ? "Connect Petra Wallet" : "Petra Not Found"}
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

      {account && (
        <div className="w-full max-w-5xl mb-8 p-4 bg-slate-800 rounded-lg text-center">
          <p>Connected Address: <span className="font-mono text-sm">{account.address}</span></p>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <h2 className="text-2xl mb-4">Available Machines</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-700 rounded">Error: {error}</div>
        )}

        {isLoading && !loadingMore ? (
          <p>Loading listings...</p>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing: any) => (
              <div key={`${listing.host_address}-${listing.id}`} className="p-4 bg-gray-800 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-sm md:text-base break-words">
                  <div><strong>ID:</strong> {listing.id}</div>
                  <div><strong>Host:</strong> <span className="font-mono">{listing.host_address}</span></div>
                  <div><strong>Type:</strong> {listing.listing_type}</div>
                  <div><strong>Price/s:</strong> {listing.price_per_second}</div>
                  <div><strong>Available:</strong> {String(listing.is_available)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchListingDetail(listing.host_address, listing.id)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-1 px-3 rounded"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}

            {/* Load more button when backend indicates there's a next cursor */}
            {nextCursor !== null && (listings.length < (total ?? Infinity)) && (
              <div className="text-center">
                <button
                  disabled={loadingMore}
                  onClick={() => loadListings(nextCursor, true)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p>No listings found. The host might not have listed a machine yet.</p>
        )}
      </div>

      {/* Listing detail drawer/modal */}
      {selectedListing && (
        <div className="fixed inset-0 flex items-center justify-center p-6">
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
    </main>
  );
}