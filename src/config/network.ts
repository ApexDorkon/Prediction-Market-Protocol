// src/config/network.ts

export const NETWORKS = {
  baseSepolia: {
    chainId: 84532,
    name: "base-sepolia",
    rpcUrl: "https://sepolia.base.org",
    usdcDecimals: 6,
    addresses: {
      FACTORY: "",
      USDC: "",
    },
  },

  // ---- Example of adding more chains later ----
  mocaTestnet: {
    chainId: 20240215,
    name: "moca-testnet",
    rpcUrl: "https://testnet.mocachain.xyz",
    usdcDecimals: 6,
    addresses: {
      FACTORY: "",
      USDC: "",
    },
  },

  monadMainnet: {
    chainId: 143,
    name: "monad-mainnet",
    rpcUrl: "https://rpc.monad.xyz",
    usdcDecimals: 6,
    addresses: {
      FACTORY: "0xeBfbE5f4EDB6378ade8A815Fc2DAf147C5b8Cb86",
      USDC: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
      MARKETPLACE: "0x55C064b10519059bc3234aCb14157bf750116541",
    },
  },
} as const;

export type SupportedNetwork = keyof typeof NETWORKS;

// Pick the active network here:
export const ACTIVE_NETWORK: SupportedNetwork = "monadMainnet";

// Export active chain config everywhere:
export const CHAIN = NETWORKS[ACTIVE_NETWORK];