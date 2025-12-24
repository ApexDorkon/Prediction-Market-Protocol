"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import type { Eip1193Provider } from "ethers";

import { ERC20ABI, BetCampaignABI } from "@/lib/abi";
import { useToast } from "@/components/toast/ToastContext";
import { CHAIN_CONFIG } from "@/config/chains";

const USDC_ADDRESS = CHAIN_CONFIG.USDC;
const USDC_DECIMALS = 6;

type Props = {
  campaignId: number;
  campaignAddress: string;
  bettingClosed: boolean;
};

type PayoutResponse = {
  potential_payout: number;
  potential_profit: number; 
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function PlaceBetForm({ campaignId, campaignAddress, bettingClosed }: Props) {
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [outcome, setOutcome] = useState<"Yes" | "No">("Yes");
  const [amount, setAmount] = useState("");
  const [payoutData, setPayoutData] = useState<PayoutResponse | null>(null);
  const [fetchingPayout, setFetchingPayout] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Real-time Payout Calculation ---
  useEffect(() => {
    if (!amount || Number(amount) <= 0) {
      setPayoutData(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setFetchingPayout(true);
        const side = outcome === "Yes"; 
        const url = `${process.env.NEXT_PUBLIC_API_URL}/calculate-payout?id=${campaignId}&side=${side}&stake=${amount}`;

        const res = await fetch(url, { signal: controller.signal });
        const json = (await res.json()) as PayoutResponse;
        setPayoutData(json);
      } catch {
        setPayoutData(null);
      } finally {
        setFetchingPayout(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [amount, outcome, campaignId]);

  const handlePlaceBet = async () => {
    if (!isConnected || !walletClient || !address) return toast.error("Connect wallet first.");
    if (!amount || Number(amount) <= 0) return toast.error("Enter valid amount.");

    try {
      setLoading(true);
      const provider = new BrowserProvider(walletClient.transport as Eip1193Provider);
      const signer = await provider.getSigner(address);

      const usdc = new Contract(USDC_ADDRESS, ERC20ABI, signer);
      const campaign = new Contract(campaignAddress, BetCampaignABI, signer);
      const parsedAmount = parseUnits(amount, USDC_DECIMALS);

      // 1. Check/Set Allowance
      toast.info("Verifying USDC allowance...");
      const allowance: bigint = await usdc.allowance(address, campaignAddress);
      if (allowance < parsedAmount) {
        const approveTx = await usdc.approve(campaignAddress, parsedAmount);
        await approveTx.wait();
        toast.success("Allowance updated.");
      }

      // 2. Join Market
      toast.info("Executing trade...");
      const side = outcome === "Yes" ? 1 : 0; // Contract: 1 for YES, 0 for NO
      const tx = await campaign.join(side, parsedAmount);
      await tx.wait();

      toast.success("Position opened successfully!");
      setAmount(""); 
    } catch (err: any) {
      console.error(err);
      toast.error(err.message?.includes("user rejected") ? "Trade cancelled." : "Execution failed.");
    } finally {
      setLoading(false);
    }
  };

  if (bettingClosed) {
    return (
      <div className="rounded-[24px] bg-[#1a1a1a] p-8 text-center border border-gray-800">
        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Market Closed</h3>
        <p className="text-gray-600 text-sm mt-2">Trading has concluded for this event.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Side Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setOutcome("Yes")}
          className={`py-3 rounded-2xl font-black transition-all border ${
            outcome === "Yes" ? "bg-green-500 text-black border-green-500" : "bg-gray-900 text-gray-500 border-gray-800"
          }`}
        >YES</button>
        <button
          onClick={() => setOutcome("No")}
          className={`py-3 rounded-2xl font-black transition-all border ${
            outcome === "No" ? "bg-red-500 text-white border-red-500" : "bg-gray-900 text-gray-500 border-gray-800"
          }`}
        >NO</button>
      </div>

      {/* Input */}
      <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 focus-within:border-gray-600 transition-all">
        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Stake (USDC)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          placeholder="0.00"
          className="bg-transparent text-2xl w-full outline-none font-mono"
        />
      </div>

      {/* Payout Details */}
      <div className="bg-gray-900/50 p-4 rounded-2xl space-y-2 text-sm border border-gray-800/50">
        <div className="flex justify-between">
          <span className="text-gray-500">Potential Payout</span>
          <span className="font-mono">{fetchingPayout ? "..." : `$${payoutData?.potential_payout.toFixed(2) ?? "0.00"}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Net Profit</span>
          <span className={`font-mono ${payoutData?.potential_profit ? "text-green-500" : ""}`}>
            {fetchingPayout ? "..." : `+${payoutData?.potential_profit.toFixed(2) ?? "0.00"}`}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handlePlaceBet}
        disabled={loading || !amount}
        className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {loading && <Spinner />}
        {loading ? "Confirming..." : "Trade Position"}
      </button>
    </div>
  );
}