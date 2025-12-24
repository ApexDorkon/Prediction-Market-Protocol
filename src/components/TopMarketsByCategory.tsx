"use client";

import { useMemo } from "react";
import Image from "next/image";
import MarketCard, { MarketSummary } from "@/components/MarketCard";

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS: Category Banner                                            */
/* -------------------------------------------------------------------------- */

const CategoryBanner = ({
  title,
  alignment,
  imageSrc,
}: {
  title: string;
  alignment: "left" | "right";
  imageSrc: string;
}) => (
  <div
    className={`
      hidden lg:flex 
      w-[180px] h-[380px]
      shrink-0 
      items-center justify-center 
      rounded-3xl border border-gray-800 bg-[#111] 
      relative overflow-hidden
      group shadow-2xl
    `}
  >
    <Image
      src={imageSrc}
      alt={`${title} Sector`}
      fill
      className="object-cover opacity-40 group-hover:opacity-60 transition-all duration-500 group-hover:scale-105"
      sizes="180px"
    />
    {/* Blue accent bar instead of purple */}
    <div
      className={`absolute top-0 bottom-0 w-1 bg-blue-500/50 z-10 ${
        alignment === "left" ? "right-0" : "left-0"
      }`}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
    <span className="absolute bottom-6 font-black uppercase tracking-widest text-[10px] text-white/50 -rotate-90 origin-center whitespace-nowrap">
      {title} Sector
    </span>
  </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { id: "CRYPTO", label: "Digital Assets", align: "left", img: "/assets/banner_crypto.png" },
  { id: "SPORTS", label: "Global Sports", align: "right", img: "/assets/banner_sports.png" },
  { id: "POLITICS", label: "World Politics", align: "left", img: "/assets/banner_politics.png" },
  { id: "SOCIAL", label: "Social Media", align: "right", img: "/assets/banner_social.png" },
] as const;

export default function TopMarketsByCategory({ markets }: { markets: MarketSummary[] }) {
  
  // Logic: Prefer Active Markets by Volume, then fill with Resolved ones
  const categoryData = useMemo(() => {
    const data: Record<string, MarketSummary[]> = {};
    const now = Math.floor(Date.now() / 1000);

    CATEGORIES.forEach((cat) => {
      const allInCat = markets.filter((m) => m.symbol?.toUpperCase() === cat.id);

      const active = allInCat.filter(m => m.state === "open" && !m.resolved && m.end_time > now);
      const finished = allInCat.filter(m => !(m.state === "open" && !m.resolved && m.end_time > now));

      // Sort by Volume
      active.sort((a, b) => (b.volume || 0) - (a.volume || 0));
      finished.sort((a, b) => (b.volume || 0) - (a.volume || 0));

      data[cat.id] = [...active, ...finished].slice(0, 3);
    });

    return data;
  }, [markets]);

  const activeCategories = CATEGORIES.filter(
    (cat) => categoryData[cat.id] && categoryData[cat.id].length > 0
  );

  if (activeCategories.length === 0) return null;

  return (
    <div className="container mx-auto px-6 py-20 space-y-24"> 
      {activeCategories.map((cat) => {
        const topMarkets = categoryData[cat.id];

        return (
          <section key={cat.id} className="relative w-full">
            {/* Sector Header */}
            <div className={`flex items-center gap-6 mb-10 ${cat.align === "right" ? "lg:flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
                  {cat.label}
                </h2>
              </div>
              <div className="h-px bg-gray-800 flex-1" />
            </div>

            {/* Content Container */}
            <div className={`flex flex-col gap-8 lg:items-center ${cat.align === "left" ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
              <CategoryBanner
                title={cat.label}
                alignment={cat.align}
                imageSrc={cat.img}
              />

              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}