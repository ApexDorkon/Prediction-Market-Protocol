"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { BrowserProvider, Contract } from "ethers";
import type { Eip1193Provider, Signer, LogDescription } from "ethers";
import ReactDatePicker from "react-datepicker";
import { addMinutes } from "date-fns";

// Standardized ABIs and Config
import BetMarketFactoryABI from "@/lib/abi/BetMarketFactory.json";
import { CHAIN_CONFIG } from "@/config/chains"; 
import "react-datepicker/dist/react-datepicker.css";

const USDC_ADDRESS = CHAIN_CONFIG.USDC;
const FACTORY_ADDRESS = CHAIN_CONFIG.FACTORY;
const USDC_DECIMALS = 6;
const REQUIRED_STAKE = BigInt(1 * 10 ** USDC_DECIMALS); // 1 USDC Stake

export default function CreateMarketPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CRYPTO");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Sports-specific state
  const [participantA, setParticipantA] = useState("");
  const [participantB, setParticipantB] = useState("");
  const [sportOutcome, setSportOutcome] = useState<"beat" | "draw" | "score">("beat");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  const [signer, setSigner] = useState<Signer | null>(null);
  const minSelectableDate = addMinutes(new Date(), 30);

  // Initialize Signer
  useEffect(() => {
    async function setup() {
      if (!walletClient || !address) return;
      const provider = new BrowserProvider(walletClient.transport as Eip1193Provider);
      const s = await provider.getSigner(address);
      setSigner(s);
    }
    setup();
  }, [walletClient, address]);

  const buildFinalTitle = () => {
    if (category !== "SPORTS") return title;
    if (sportOutcome === "beat") return `${participantA} beats ${participantB}?`;
    if (sportOutcome === "draw") return `${participantA} and ${participantB} draw?`;
    return `${participantA} vs ${participantB} ends ${scoreA}-${scoreB}?`;
  };

  const handleCreateMarket = async () => {
    if (!signer || !address) return alert("Please connect wallet");
    if (!selectedDate) return alert("Select an end date");
    
    try {
      setLoading(true);
      const endUnix = Math.floor(selectedDate.getTime() / 1000);
      const finalTitle = buildFinalTitle();
      
      const usdc = new Contract(
        USDC_ADDRESS,
        ["function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"],
        signer
      );

      // Check and Approve Allowance
      const allowance: bigint = await usdc.allowance(address, FACTORY_ADDRESS);
      if (allowance < REQUIRED_STAKE) {
        const approveTx = await usdc.approve(FACTORY_ADDRESS, REQUIRED_STAKE);
        await approveTx.wait();
      }

      // Execute Creation
      const factory = new Contract(FACTORY_ADDRESS, BetMarketFactoryABI, signer);
      const tx = await factory.createCampaign(finalTitle, category, endUnix, 200); // 2% fee
      const receipt = await tx.wait();

      // Extract Address from Logs
      let marketAddress = "";
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "CampaignDeployed") {
            marketAddress = parsed.args[2];
            break;
          }
        } catch (e) { continue; }
      }

      alert(`Market deployed at: ${marketAddress}`);
    } catch (err) {
      console.error(err);
      alert("Deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-6">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Create Prediction Market
          </h1>
          <p className="text-gray-400 mt-2">Deploy a decentralized binary option pool.</p>
        </header>

        <div className="bg-[#111] border border-gray-800 p-8 rounded-[32px] shadow-2xl space-y-6">
          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl focus:border-blue-500 outline-none"
            >
              <option value="CRYPTO">Crypto</option>
              <option value="SPORTS">Sports</option>
              <option value="POLITICS">Politics</option>
            </select>
          </div>

          {/* Dynamic Inputs */}
          {category === "SPORTS" ? (
            <div className="space-y-4">
              <input 
                placeholder="Team/Participant A" 
                className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl outline-none"
                onChange={(e) => setParticipantA(e.target.value)}
              />
              <input 
                placeholder="Team/Participant B" 
                className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl outline-none"
                onChange={(e) => setParticipantB(e.target.value)}
              />
              <select 
                className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl outline-none"
                onChange={(e) => setSportOutcome(e.target.value as any)}
              >
                <option value="beat">A beats B</option>
                <option value="draw">Draw</option>
                <option value="score">Exact Score</option>
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-gray-500">Market Question</label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Will ETH reach $5000 by end of month?" 
                className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Resolution Date</label>
            <ReactDatePicker
              selected={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              showTimeSelect
              minDate={new Date()}
              className="w-full bg-[#1a1a1a] border border-gray-800 p-3 rounded-xl outline-none"
              placeholderText="Select expiration date"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleCreateMarket}
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {loading ? "Deploying Protocol..." : "Create Market"}
          </button>
          
          <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest">
            Protocol Requirement: 1.00 USDC Creation Stake
          </p>
        </div>
      </div>
    </div>
  );
}