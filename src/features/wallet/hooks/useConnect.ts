import { useWalletContext } from "../context/WalletProvider";

export function useConnect() {
  const { setAddress } = useWalletContext();
  const connect = async () => {
    setAddress("0x0000000000000000000000000000000000000000");
  };
  const disconnect = () => setAddress(null);
  return { connect, disconnect, isConnecting: false, error: null as unknown };
}




