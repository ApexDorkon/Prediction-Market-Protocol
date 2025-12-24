"use client";

import { useEffect, useState, useCallback } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import Image from "next/image";
import BetCampaignABI from "@/lib/abi/BetCampaign.json";
import { CHAIN_CONFIG } from "@/config/chains";
import { useToast } from "@/components/toast/ToastContext";
import { useAccount, useWriteContract } from "wagmi";

type GalleryTicket = {
  id: number;
  side: number;
  stake: number;
  claimed: boolean;
  won: boolean;
  pnl: number;
  imageUrl: string;
};

type BackendBet = {
  ticket_id: number;
  campaign_address: string;
  side: boolean;
  stake: number;
  payout: number | null;
};

export default function TicketGallery({
  campaignAddress,
  state: marketState,
}: {
  campaignAddress: `0x${string}`;
  state: number;
}) {
  const { address } = useAccount();
  const toast = useToast();
  const { writeContractAsync } = useWriteContract();

  const [tickets, setTickets] = useState<GalleryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const isResolved = marketState === 1;

  const loadTickets = useCallback(async () => {
    if (!address) return;
    setLoading(true);

    try {
      // 1. Fetch user bets from backend registry
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bet/me/user-bets`);
      const json = await res.json();
      const userBets = json.bets.filter(
        (b: BackendBet) => b.campaign_address.toLowerCase() === campaignAddress.toLowerCase()
      );

      if (userBets.length === 0) {
        setTickets([]);
        return;
      }

      // 2. Fetch on-chain state for these specific tickets
      const provider = new JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
      const contract = new Contract(campaignAddress, BetCampaignABI, provider);

      const [outcome, totalTrue, totalFalse, totalInitialPot, feeBps] = await Promise.all([
        contract.outcomeTrue(),
        contract.totalTrue().then((n: bigint) => Number(n)/1e6),
        contract.totalFalse().then((n: bigint) => Number(n)/1e6),
        contract.totalInitialPot().then((n: bigint) => Number(n)/1e6),
        contract.feeBps().then((n: bigint) => Number(n)),
      ]);

      const pool = totalTrue + totalFalse + totalInitialPot;
      const distributable = pool - (pool * feeBps / 10000);

      const result: GalleryTicket[] = [];

      for (const bet of userBets) {
        try {
          const t = await contract.tickets(bet.ticket_id);
          const stake = Number(t.stake) / 1e6;
          const side = Number(t.side); // 1 = YES, 0 = NO
          
          let won = false;
          let pnl = 0;

          if (isResolved) {
            won = outcome ? side === 1 : side === 0;
            const winnersTotal = outcome ? totalTrue : totalFalse;
            pnl = won ? (stake / winnersTotal) * distributable : -stake;
          }

          result.push({
            id: bet.ticket_id,
            side,
            stake,
            claimed: t.claimed,
            won,
            pnl,
            // Professional generic placeholder image
            imageUrl: t.claimed ? "/assets/ticket_burned.png" : "/assets/ticket_active.png",
          });
        } catch (err) { continue; }
      }
      setTickets(result);
    } catch (err) {
      console.error("Gallery Error:", err);
    } finally {
      setLoading(false);
    }
  }, [address, campaignAddress, isResolved]);

  useEffect(() => { loadTickets(); }, [loadTickets, address]);

  const handleClaim = async (ticketId: number) => {
    setClaimingId(ticketId);
    try {
      const tx = await writeContractAsync({
        address: campaignAddress,
        abi: BetCampaignABI,
        functionName: "claim",
        args: [ticketId],
      });
      toast.info("Claim transaction submitted...");
      await loadTickets();
      toast.success("Rewards claimed!");
    } catch (err) {
      toast.error("Claim failed.");
    } finally {
      setClaimingId(null);
    }
  };

  if (!address || loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Synchronizing on-chain tickets...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
      {tickets.map((t) => (
        <div key={t.id} className="bg-[#111] border border-gray-800 rounded-2xl p-4 overflow-hidden relative group transition-all hover:border-gray-600">
          <div className="aspect-square relative rounded-xl overflow-hidden mb-4 bg-gray-900">
            <Image src={t.imageUrl} fill alt="Ticket" className={`object-cover ${t.claimed ? 'opacity-30 grayscale' : ''}`} />
            <div className="absolute top-2 right-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${t.won ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                    {t.claimed ? "CLAIMED" : t.won ? "WINNER" : "ACTIVE"}
                </span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-gray-500">TICKET #{t.id}</span>
            <span className={`text-xs font-black ${t.side === 1 ? 'text-green-500' : 'text-red-500'}`}>
                {t.side === 1 ? "YES" : "NO"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-800 pt-3">
            <div>
                <p className="text-gray-500">Stake</p>
                <p className="font-bold">{t.stake} USDC</p>
            </div>
            <div className="text-right">
                <p className="text-gray-500">{isResolved ? "PNL" : "Value"}</p>
                <p className={`font-bold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {t.pnl > 0 ? '+' : ''}{t.pnl.toFixed(2)}
                </p>
            </div>
          </div>

          {isResolved && t.won && !t.claimed && (
            <button
              onClick={() => handleClaim(t.id)}
              disabled={claimingId === t.id}
              className="w-full mt-4 bg-white text-black py-2 rounded-xl text-xs font-bold hover:bg-gray-200"
            >
              {claimingId === t.id ? "Processing..." : "Claim Rewards"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}