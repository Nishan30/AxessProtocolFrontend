// File: src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ("petra" in window) {
      setWalletDetected(true);
    }
  }, []);

  const connectWallet = async () => {
    if (!walletDetected) return;
    try {
      const walletAccount = await window.petra.connect();
      setAccount(walletAccount);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setAccount(null);
    }
  };

  const disconnectWallet = async () => {
    if (account && window.petra.disconnect) {
      await window.petra.disconnect();
      setAccount(null);
    }
  };

  useEffect(() => {
    async function fetchListings() {
      try {
        setIsLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/v1/listings");
        const data = await response.json();
        // --- THIS IS THE FIX ---
        // We need to access the .items property of the response object
        setListings(data.items);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListings();
  }, []);

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
        {isLoading ? (
          <p>Loading listings...</p>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing: any, index) => (
              <pre key={index} className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto">
                {JSON.stringify(listing, null, 2)}
              </pre>
            ))}
          </div>
        ) : (
          <p>No listings found. The host might not have listed a machine yet.</p>
        )}
      </div>
    </main>
  );
}