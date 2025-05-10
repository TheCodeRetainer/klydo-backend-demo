import { AddressSource, Chain } from "./address";

export interface Transaction {
  id: string; // Transaction hash
  address: string; // The watched address involved in the transaction
  source: AddressSource; // Source of the watched address
  chain: Chain; // Ethereum or Base
  direction: "sent" | "received"; // Direction relative to the watched address
  fromAddress: string;
  toAddress: string;
  value: string; // Value in wei/gwei
  valueInEth: number; // Value in ETH/BASE
  valueInUsd: number; // USD value at fixed rate
  timestamp: number; // Unix timestamp
  blockNumber: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  // MongoDB document properties (added by Mongoose)
  _id?: any;
  __v?: number;
}

// Direction types for better type safety
export enum TransactionDirection {
  SENT = "sent",
  RECEIVED = "received",
}
