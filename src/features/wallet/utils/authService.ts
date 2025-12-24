// src/features/wallet/utils/authService.ts
import api from "@/config/api";

/* ===================================
   API Response Types
=================================== */

// /auth/nonce → returns nonce and message
export interface NonceResponse {
  nonce: string;
  message: string;
}

// /auth/verify → two possible outcomes
export interface VerifyPending {
  status: "pending_username";
  message: string;
  wallet_address: string;
}

export interface VerifySuccess {
  status: "success";
  access_token: string;
  wallet_address: string;
  expires_in_days: number;
}

export type VerifyResponse = VerifyPending | VerifySuccess;

// /auth/create-user → returns JWT after username creation
export interface CreateUserSuccess {
  status: "success";
  access_token: string;
  wallet_address: string;
  expires_in_days?: number;
}

export type CreateUserResponse = CreateUserSuccess;

/* ===================================
   API Calls
=================================== */

// 1️⃣ Get a nonce + message for wallet to sign
export async function getNonce(walletAddress: string): Promise<NonceResponse> {
  const res = await api.post<NonceResponse>("/auth/nonce", null, {
    params: { wallet_address: walletAddress },
  });
  return res.data;
}

// 2️⃣ Verify the signature → returns token or pending username
export async function verifySignature(
  walletAddress: string,
  signature: string
): Promise<VerifyResponse> {
  const res = await api.post<VerifyResponse>("/auth/verify", null, {
    params: { wallet_address: walletAddress, signature },
  });
  return res.data;
}

// 3️⃣ Create a new user (username + optional referral)
export async function createUser(
  walletAddress: string,
  username: string,
  refCode?: string | null
): Promise<CreateUserResponse> {

  const res = await api.post<CreateUserResponse>("/auth/create-user", null, {
    params: {
      wallet_address: walletAddress,
      username,
      ref_code_used: refCode ?? null,   // ⭐ send ref code when present
    },
  });

  return res.data;
}