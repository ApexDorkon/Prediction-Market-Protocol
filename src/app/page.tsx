"use client";

import { useEffect, useState, useMemo } from "react";
import MarketCard, { MarketSummary } from "@/components/MarketCard";
import Hero from "@/components/Hero";
import TopMarketsByCategory from "@/components/TopMarketsByCategory";
import { useSelector } from "react-redux";
import type { RootState } from "@/state/store";

export default function Home() {
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector for global search state
  const query = useSelector((s: RootState) => s.ui.searchQuery).toLowerCase().trim();

  // Filter States
  const [activeFilter, setActiveFilter] = useState<"All" | "Running" | "Pending" | "Ended">("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "SPORTS" | "CRYPTO" | "POLITICS" | "SOCIAL">("All");

  useEffect(() => {
    async function loadMarkets() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);
        const data = await res.json();
        setMarkets(data); 
      } catch (err) {
        console.error("Failed to load markets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMarkets();
  }, []);

  const filteredMarkets = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);

    return markets.filter((m) => {
      const matchesQuery = !query || m.name?.toLowerCase().includes(query) || m.symbol?.toLowerCase().includes(query);
      
      const isEnded = m.end_time <= now;
      const isOpen = m.state === "open";

      let status: "Running" | "Pending" | "Ended";
      if (isOpen && !isEnded) status = "Running";
      else if (isOpen && isEnded) status = "Pending";
      else status = "Ended";

      const matchesStatus = activeFilter === "All" || status === activeFilter;
      const matchesCategory = categoryFilter === "All" || m.symbol?.toUpperCase() === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [markets, query, activeFilter, categoryFilter]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Hero markets={markets} />

      {!loading && markets.length > 0 && (
         <div className="hidden lg:block border-b border-gray-800 bg-[#111]/30">
            <TopMarketsByCategory markets={markets} />
         </div>
      )}

      <div className="container mx-auto p-6 mt-8">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Live Markets</h2>
            <p className="text-sm text-gray-500 font-medium">Filter by real-world events or asset categories.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Pills */}
            <div className="flex bg-[#111] p-1 rounded-xl border border-gray-800">
              {["All", "Running", "Pending", "Ended"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeFilter === f ? "bg-white text-black" : "text-gray-500 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Category Selector */}
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-[#111] border border-gray-800 text-xs font-bold p-2 rounded-xl outline-none focus:border-blue-500"
            >
              {["All", "SPORTS", "CRYPTO", "POLITICS", "SOCIAL"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-[#111] animate-pulse rounded-[32px]" />)}
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-gray-800 rounded-[32px]">
            <p className="text-gray-500">No markets found matching those parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}