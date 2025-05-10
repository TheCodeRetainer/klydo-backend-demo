export interface Address {
  address: string;
  source: "privy" | "bridge" | "json";
  chain: "ethereum" | "base";
  network: "mainnet";
  createdAt: string;
  updatedAt: string;
  lastIndexedAt?: string | null;
}

// Source types for better type safety
export enum AddressSource {
  PRIVY = "privy",
  BRIDGE = "bridge",
  JSON = "json",
}

// Chain types
export enum Chain {
  ETHEREUM = "ethereum",
  BASE = "base",
}

// Network types
export enum Network {
  MAINNET = "mainnet",
}
