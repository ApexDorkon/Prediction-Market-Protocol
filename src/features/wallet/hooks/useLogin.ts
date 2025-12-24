"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { getNonce, verifySignature } from "../utils/authService";

/* ===================================
   Hook Return Types
=================================== */
export type LoginResult =
  | { status: "success"; token: string; walletAddress: string }
  | { status: "pending_username"; walletAddress: string }
  | { status: "error"; message: string };

/* ===================================
   useLogin Hook
=================================== */
export function useLogin() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (): Promise<LoginResult> => {
    try {
      setLoading(true);
      setError(null);

      if (!address) throw new Error("Wallet not connected");

      // 1️⃣ Get the nonce message from backend
      const { message } = await getNonce(address);

      // 2️⃣ Ask MetaMask (or wallet) to sign it
      const signature = await signMessageAsync({ message });

      // 3️⃣ Verify the signature
      const verifyRes = await verifySignature(address, signature);

      // 🔹 Handle "pending_username"
      if (verifyRes.status === "pending_username") {
        return {
          status: "pending_username",
          walletAddress: verifyRes.wallet_address,
        };
      }

      // 🔹 Handle success (returning user)
      if (verifyRes.status === "success") {
        const walletAddress = verifyRes.wallet_address;
        const token = verifyRes.access_token;

        localStorage.setItem("access_token", token);
        localStorage.setItem("wallet_address", walletAddress);

        return { status: "success", token, walletAddress };
      }

      throw new Error("Unexpected response format");
    } catch (err: unknown) {
      console.error("Login error:", err);

      // ✅ Properly narrow unknown error
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Unknown error";

      setError(message);
      return { status: "error", message };
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
