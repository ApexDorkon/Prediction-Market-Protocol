"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { FaSearch, FaUserCircle, FaSignOutAlt } from "react-icons/fa";

interface MarketSummary {
  id: number;
  name: string;
  symbol: string;
}

export default function Header() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allMarkets, setAllMarkets] = useState<MarketSummary[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Pre-load markets for search functionality
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);
        const data = await res.json();
        setAllMarkets(data);
      } catch (e) { console.error("Search sync failed", e); }
    }
    load();
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allMarkets
      .filter((m) => m.name.toLowerCase().includes(q) || m.symbol.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, allMarkets]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setMenuOpen(false);
    disconnect();
    router.refresh();
  };

  if (!mounted) return null;

  return (
    <header className="w-full sticky top-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Logo / Title */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black italic">
            P
          </div>
          <span className="hidden md:block font-black text-xl tracking-tighter uppercase italic text-white">
            Protocol
          </span>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search markets..."
              className="w-full bg-[#111] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Search Dropdown */}
          {searchOpen && query && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    router.push(`/markets/${m.id}`);
                    setSearchOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-800 flex justify-between items-center transition-colors"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">{m.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation & Wallet */}
        <div className="flex items-center gap-4 relative">
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted: ready }) => {
              const connected = ready && account && chain;

              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="bg-white text-black px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all shadow-lg shadow-white/5"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Connected</p>
                    <p className="text-xs font-mono text-white">{account.displayName}</p>
                  </div>
                  
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center hover:border-gray-600 transition-all"
                  >
                    <FaUserCircle size={20} className="text-gray-400" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-48 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-4">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <FaUserCircle /> My Tickets
                      </Link>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/5 transition-colors"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt /> Disconnect
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}