import { Schema, model } from 'mongoose';
import { AddressSource, Chain, Network } from './address';
import { TransactionDirection } from './transaction';

// Address Schema
const addressSchema = new Schema({
  address: { type: String, required: true, unique: true, index: true },
  source: { 
    type: String, 
    required: true, 
    enum: Object.values(AddressSource)
  },
  chain: { 
    type: String, 
    required: true, 
    enum: Object.values(Chain)
  },
  network: { 
    type: String, 
    required: true, 
    enum: Object.values(Network)
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  lastIndexedAt: { type: String }
});

// Transaction Schema
const transactionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  address: { type: String, required: true, index: true },
  source: { 
    type: String, 
    required: true, 
    enum: Object.values(AddressSource)
  },
  chain: { 
    type: String, 
    required: true, 
    enum: Object.values(Chain)
  },
  direction: { 
    type: String, 
    required: true, 
    enum: Object.values(TransactionDirection)
  },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  value: { type: String, required: true },
  valueInEth: { type: Number, required: true },
  valueInUsd: { type: Number, required: true },
  timestamp: { type: Number, required: true, index: true },
  blockNumber: { type: Number, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true }
});

// Create models
export const AddressModel = model('Address', addressSchema);
export const TransactionModel = model('Transaction', transactionSchema);
