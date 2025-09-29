"use client";

import Link from 'next/link';
import { useWalletStore } from '@/lib/use-wallet-store'; // We still want the wallet state for the header
import { useState, useEffect } from 'react';

const HomePage = () => {
    // We can still show wallet status in the main header for a consistent experience
    const { account, setAccount } = useWalletStore();
    // This could be simplified if you create a dedicated <Header /> component
    const [walletDetected, setWalletDetected] = useState(false);
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

    return (
        <div className="bg-slate-900 text-white min-h-screen">
            {/* Header */}
            <header className="w-full max-w-6xl mx-auto p-4 flex justify-between items-center">
                <div className="text-xl font-bold">Unified Compute</div>
                <div className="flex items-center gap-4">
                    <Link href="/docs" className="text-gray-300 hover:text-white">Docs</Link>
                    {!account ? (
                        <button onClick={connectWallet} disabled={!walletDetected} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
                            {walletDetected ? "Connect Wallet" : "Petra Not Found"}
                        </button>
                    ) : (
                        <button onClick={disconnectWallet} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                            Disconnect
                        </button>
                    )}
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="text-center flex flex-col items-center justify-center pt-24 pb-32 px-4">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                    Decentralized GPU Cloud <br /> for <span className="text-cyan-400">AI & Compute</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg md:text-xl text-gray-300">
                    Access a global network of GPU providers for your machine learning, rendering, and scientific computing tasks. Powered by the Aptos blockchain.
                </p>

                {/* Main Call-to-Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Link href="/marketplace" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg py-3 px-8 rounded-lg transition-transform transform hover:scale-105">
                        Rent a GPU Now
                    </Link>
                    <Link href="/host" className="bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg py-3 px-8 rounded-lg transition-transform transform hover:scale-105">
                        Become a Host
                    </Link>
                </div>
            </main>

            {/* Early Access Form Section */}
            <section id="early-access" className="w-full bg-gray-800 py-20">
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold">Get Early Access & Project Updates</h2>
                    <p className="mt-4 text-gray-400">
                        We are currently in a closed beta on the Aptos Testnet. Sign up to get notified about our Mainnet launch, new features, and developer incentives.
                    </p>
                    <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => { e.preventDefault(); alert('Thank you for signing up!'); }}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            required
                            className="flex-grow p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-md">
                            Notify Me
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default HomePage;