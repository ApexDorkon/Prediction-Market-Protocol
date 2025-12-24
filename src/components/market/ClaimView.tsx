"use client";

import { useEffect, useState, useCallback } from "react";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import BetCampaignABI from "@/lib/abi/BetCampaign.json";
import { CHAIN_CONFIG } from "@/config/chains";
import { useToast } from "@/components/toast/ToastContext";
import { useAccount, useWriteContract } from "wagmi";

/* ------------------------------- Types ------------------------------- */
type Ticket = {
  id: number;
  side: number; 
  stake: number; 
  claimed: boolean;
};

type BackendBet = {
  ticket_id: number;
  claimed: boolean;
  payout: number;
  campaign_address: string;
};

type ClaimViewProps = {
  campaignAddress: `0x${string}`;
  endTime: number;
  isResolvedBackend: boolean;
  outcomeBackend: number;
};

/* --------------------------- Main Component --------------------------- */
export default function ClaimView({
  campaignAddress,
  endTime,
  isResolvedBackend,
  outcomeBackend,
}: ClaimViewProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  
  // State Management
  const [state, setState] = useState<number | null>(null);
  const [winningTickets, setWinningTickets] = useState<Ticket[]>([]);
  const [totalPayout, setTotalPayout] = useState<number>(0);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);
  const [hasJoined, setHasJoined] = useState(false);

  // Resolution Helpers
  const now = Math.floor(Date.now() / 1000);
  const isResolved = isResolvedBackend || state === 1;
  const isPending = !isResolved && endTime <= now;
  const isRunning = !isResolved && endTime > now;

  const loadMarketData = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      const provider = new JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
      const contract = new Contract(campaignAddress, BetCampaignABI, provider);

      // Fetch Global Market State
      const [s, outcome, totalTrue, totalFalse, totalInitialPot, feeBps] = await Promise.all([
        contract.state(),
        contract.outcomeTrue(),
        contract.totalTrue(),
        contract.totalFalse(),
        contract.totalInitialPot(),
        contract.feeBps(),
      ]);

      setState(Number(s));

      // Fetch User's Backend Context
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bet/me/user-bets`);
      const data = await res.json();
      const userBets: BackendBet[] = data.bets.filter(
        (b: BackendBet) => b.campaign_address.toLowerCase() === campaignAddress.toLowerCase()
      );

      setHasJoined(userBets.length > 0);
      
      // Filter for winning tickets
      if (isResolved) {
        const actualOutcome = isResolvedBackend ? (outcomeBackend === 1) : outcome;
        const winners: Ticket[] = [];
        let calculatedPayout = 0;

        const pool = (Number(totalTrue) + Number(totalFalse) + Number(totalInitialPot)) / 1e6;
        const distributable = pool - (pool * Number(feeBps) / 10000);
        const winnersTotalStake = (actualOutcome ? Number(totalTrue) : Number(totalFalse)) / 1e6;

        for (const bet of userBets) {
          const t = await contract.tickets(bet.ticket_id);
          const side = Number(t.side); // 1 = True, 0 = False
          const win = actualOutcome ? side === 1 : side === 0;

          if (win && !t.claimed) {
            const stake = Number(t.stake) / 1e6;
            winners.push({ id: bet.ticket_id, side, stake, claimed: false });
            calculatedPayout += (stake * distributable) / winnersTotalStake;
          } else if (t.claimed) {
              setClaimedAmount(prev => prev + (Number(bet.payout) || 0));
          }
        }
        setWinningTickets(winners);
        setTotalPayout(calculatedPayout);
      }
    } catch (err) {
      console.error("Market load error:", err);
    } finally {
      setLoading(false);
    }
  }, [address, campaignAddress, isResolved]);

  useEffect(() => { loadMarketData(); }, [address, loadMarketData]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      for (const ticket of winningTickets) {
        const tx = await writeContractAsync({
          address: campaignAddress,
          abi: BetCampaignABI,
          functionName: "claim",
          args: [ticket.id],
        });
        toast.info(`Claiming ticket #${ticket.id}...`);
        // In a real app, you would wait for confirmation and notify the backend here
      }
      toast.success("Rewards successfully claimed!");
      loadMarketData();
    } catch (e) {
      toast.error("Claim failed.");
    } finally {
      setClaiming(false);
    }
  };

  if (!address) return <div className="p-4 text-center text-gray-500">Connect wallet to view rewards.</div>;
  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!hasJoined) return <div className="p-4 bg-gray-900 rounded-2xl text-center text-gray-500">You did not participate in this market.</div>;
  if (isRunning) return <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-blue-400 text-center">Market active. Results pending expiration.</div>;
  if (isPending) return <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-yellow-400 text-center">Awaiting Oracle resolution...</div>;

  return (
    <div className="space-y-4">
      {winningTickets.length > 0 ? (
        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-[32px] text-center">
          <h3 className="text-2xl font-black text-green-500 mb-1">WINNER</h3>
          <p className="text-gray-400 text-sm mb-4">You have {winningTickets.length} winning tickets.</p>
          <div className="text-3xl font-mono font-bold mb-6">${totalPayout.toFixed(2)}</div>
          <button 
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-green-500 text-black py-4 rounded-2xl font-bold hover:bg-green-400 transition-all"
          >
            {claiming ? "Processing..." : "Claim All Rewards"}
          </button>
        </div>
      ) : (
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-[32px] text-center">
          <p className="text-gray-500">Your predictions were incorrect for this event.</p>
          {claimedAmount > 0 && <p className="text-green-500 text-sm mt-2">Total Claimed: ${claimedAmount.toFixed(2)}</p>}
        </div>
      )}
    </div>
  );
}