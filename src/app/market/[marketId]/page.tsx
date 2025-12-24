"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// --- Components ---
import PlaceBetForm from "@/components/PlaceBetForm";
import ClaimView from "@/components/market/ClaimView";
import TicketGallery from "@/components/market/TicketGallery";

// --- Icons ---
const IconArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>;

type Market = {
  id: number;
  name: string;
  symbol: string;
  creator_wallet: string;
  campaign_address: string;
  end_time: number;
  state: string;
  volume: number;
  yes_odds: number;
  no_odds: number;
  percent_true: number;
  percent_false: number;
  resolved: boolean;
  outcome_true: number;
};

export default function MarketDetailPage() {
  const { marketId } = useParams();
  const router = useRouter();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarket() {
      try {
        // Replace with your actual public API or Mock logic
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets/${marketId}`);
        const data = await res.json();
        setMarket(data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
  }, [marketId]);

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Market Data...</div>;
  if (!market) return <div className="p-20 text-center">Market not found.</div>;

  const isOpen = market.state === "open" && !market.resolved;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-800 bg-[#111]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/markets" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <IconArrowLeft /> <span>Back to Explore</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isOpen ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
              {isOpen ? "• ACTIVE" : "• CLOSED"}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Market Info */}
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-white italic uppercase tracking-tighter">
              {market.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm">
              <div className="flex items-center gap-1"><IconWallet /> {market.creator_wallet.slice(0,6)}...</div>
              <div className="flex items-center gap-1"><IconClock /> Ends {new Date(market.end_time * 1000).toLocaleDateString()}</div>
            </div>
          </section>

          {/* Probability Chart Section */}
          <section className="bg-[#111] border border-gray-800 p-8 rounded-[40px] shadow-2xl">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Market Probability</h3>
            <div className="space-y-10">
              {/* YES BAR */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-green-500">YES</span>
                  <span className="text-3xl font-mono">{market.percent_true}%</span>
                </div>
                <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${market.percent_true}%` }} />
                </div>
              </div>

              {/* NO BAR */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-red-500">NO</span>
                  <span className="text-3xl font-mono">{market.percent_false}%</span>
                </div>
                <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${market.percent_false}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* Activity Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Recent Market Activity</h2>
            <TicketGallery campaignAddress={market.campaign_address as `0x${string}`} />
          </section>
        </div>

        {/* Right: Action Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-32 space-y-6">
            <div className="bg-[#111] border border-gray-800 p-6 rounded-[32px] shadow-2xl">
              <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Take a Position</h2>
              {isOpen ? (
                <PlaceBetForm campaignAddress={market.campaign_address} />
              ) : (
                <ClaimView campaignAddress={market.campaign_address as `0x${string}`} />
              )}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-[32px]">
              <h4 className="text-blue-400 text-sm font-bold mb-2">Protocol Logic</h4>
              <p className="text-xs text-blue-200/60 leading-relaxed italic">
                This is a binary outcome market. If your side wins, you earn a proportional share of the losing pool minus a 2% protocol fee.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}