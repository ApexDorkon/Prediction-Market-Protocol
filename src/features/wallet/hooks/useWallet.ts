import { useWalletContext } from "../context/WalletProvider";

export function useWallet() {
  const { address } = useWalletContext();
  return { address };
}



