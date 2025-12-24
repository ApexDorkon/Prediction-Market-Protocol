"use client";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type WalletContextValue = {
  address: string | null;
  setAddress: (addr: string | null) => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const value = useMemo(() => ({ address, setAddress }), [address]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
}




