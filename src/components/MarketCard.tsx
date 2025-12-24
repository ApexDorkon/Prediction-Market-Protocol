"use client";

import Link from "next/link";

export type MarketSummary = {
  id: number;
  name: string;
  symbol: string;
  end_time: number;
  state: string;
  resolved: boolean;
  fee_bps: number;
  campaign_address: string;

  // Stats from API
  totalTrue: number;
  totalFalse: number;
  totalInitialPot: number;
  volume: number;
  yes_odds: number;
  no_odds: number;
  percent_true: number;
  percent_false: number;
};

function formatUsdShort(n: number) {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}b`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function formatCountdown(endUnix: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(endUnix - now, 0);

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `Ends in ${days}d ${hours}h`;
  if (hours > 0) return `Ends in ${hours}h ${minutes}m`;
  return `Ends in ${minutes}m`;
}

export default function MarketCard({ market }: { market: MarketSummary }) {
  const now = Math.floor(Date.now() / 1000);
  const isEnded = market.end_time <= now;

  // ---- Status logic ----
  let statusLabel = "Ended";
  let statusColor = "text-red-400";
  let dotColor = "bg-red-500";

  if (market.state === "open" && !market.resolved && !isEnded) {
    statusLabel = "Running";
    statusColor = "text-green-400";
    dotColor = "bg-green-500";
  } else if (market.state === "open" && market.resolved) {
    statusLabel = "Pending";
    statusColor = "text-yellow-400";
    dotColor = "bg-yellow-400";
  }

  return (
    <Link
      href={`/market/${market.id}`}
      className="group relative overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900 p-4 hover:border-accentPurple/40 transition-all hover:shadow-[0_0_25px_rgba(155,93,229,0.35)]"
    >
      {/* Top Glow */}
      <div
        className="absolute inset-x-0 top-0 h-20 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(155,93,229,0.4), rgba(155,93,229,0) 70%)",
        }}
      />

      {/* Status */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${dotColor}`} />
        <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Volume */}
      <div className="mb-3 text-sm text-neutral-500">
        {formatUsdShort(market.volume)} Vol.
      </div>

      {/* Symbol */}
      {market.symbol && (
        <div className="mb-2 inline-flex items-center rounded-full bg-accentPurple/15 text-accentPurple px-2.5 py-0.5 text-xs font-medium">
          {market.symbol}
        </div>
      )}

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold group-hover:text-accentPurple">
        {market.name}
      </h3>

      {/* Countdown */}
      <p className="text-xs text-neutral-500 mb-3">
        {formatCountdown(market.end_time)}
      </p>

      {/* YES / NO */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_12px_rgba(34,197,94,0.25)]">
          <span className="text-neutral-300">Yes</span>
          <span className="font-semibold text-neutral-200">{market.percent_true}%</span>
        </div>

        <div className="flex items-center justify-between rounded-md bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm transition-all duration-300 hover:border-red-500/40 hover:shadow-[0_0_12px_rgba(239,68,68,0.25)]">
          <span className="text-neutral-300">No</span>
          <span className="font-semibold text-neutral-200">{market.percent_false}%</span>
        </div>
      </div>
    </Link>
  );
}