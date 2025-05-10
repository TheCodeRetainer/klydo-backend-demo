import { Alchemy, Network as AlchemyNetwork, AssetTransfersCategory } from 'alchemy-sdk';
import { Transaction, TransactionDirection } from '../models/transaction';
import { Chain, AddressSource } from '../models/address';
import { logger } from '../utils/logger';

// Fixed ETH/BASE to USD conversion rates
const ETH_USD_RATE = 3000;
const BASE_USD_RATE = 3000; // Using same rate for simplicity

export class AlchemyService {
  private ethereumClient: Alchemy;
  private baseClient: Alchemy;

  constructor() {
    // Check if Alchemy API key is set
    if (!process.env.ALCHEMY_API_KEY) {
      logger.error('ALCHEMY_API_KEY is not set in environment variables');
      throw new Error('ALCHEMY_API_KEY is required to fetch blockchain transactions');
    }
    
    logger.info(`Initializing Alchemy clients with API key: ${process.env.ALCHEMY_API_KEY.substring(0, 3)}...`);
    
    // Initialize Ethereum client
    this.ethereumClient = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: AlchemyNetwork.ETH_MAINNET,
    });

    // Initialize Base client
    this.baseClient = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: AlchemyNetwork.BASE_MAINNET,
    });
  }

  /**
   * Get transactions for an address on Ethereum
   */
  async getEthereumTransactions(address: string): Promise<Transaction[]> {
    return this.getTransactions(address, Chain.ETHEREUM);
  }

  /**
   * Get transactions for an address on Base
   */
  async getBaseTransactions(address: string): Promise<Transaction[]> {
    return this.getTransactions(address, Chain.BASE);
  }

  /**
   * Get transactions for an address on a specific chain
   */
  private async getTransactions(address: string, chain: Chain): Promise<Transaction[]> {
    try {
      logger.info(`Fetching ${chain} transactions for address: ${address}`);
      
      const client = chain === Chain.ETHEREUM ? this.ethereumClient : this.baseClient;
      const usdRate = chain === Chain.ETHEREUM ? ETH_USD_RATE : BASE_USD_RATE;
      
      // Define categories based on chain
      // Base network doesn't support internal transactions
      const categories = chain === Chain.ETHEREUM 
        ? [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL]
        : [AssetTransfersCategory.EXTERNAL];
      
      logger.debug(`Using categories for ${chain}: ${categories.join(', ')}`);
      
      // Get sent transactions (from address)
      const sentTransactionsResponse = await client.core.getAssetTransfers({
        fromAddress: address,
        category: categories,
        withMetadata: true,
      });
      
      // Get received transactions (to address)
      const receivedTransactionsResponse = await client.core.getAssetTransfers({
        toAddress: address,
        category: categories,
        withMetadata: true,
      });
      
      const transactions: Transaction[] = [];
      
      // Process sent transactions
      for (const tx of sentTransactionsResponse.transfers) {
        if (tx.hash && tx.from && tx.to) {
          const valueInEth = tx.value || 0
          
          transactions.push({
            id: tx.hash,
            address: address.toLowerCase(),
            source: AddressSource.JSON, // This will be updated when saving
            chain,
            direction: TransactionDirection.SENT,
            fromAddress: tx.from.toLowerCase(),
            toAddress: tx.to.toLowerCase(),
            value: tx.rawContract?.value || '0',
            valueInEth,
            valueInUsd: valueInEth * usdRate,
            timestamp: tx.metadata?.blockTimestamp 
              ? new Date(tx.metadata.blockTimestamp).getTime() 
              : Date.now(),
            blockNumber: Number(tx.blockNum) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      // Process received transactions
      for (const tx of receivedTransactionsResponse.transfers) {
        if (tx.hash && tx.from && tx.to) {
          const valueInEth = tx.value || 0
          
          transactions.push({
            id: tx.hash,
            address: address.toLowerCase(),
            source: AddressSource.JSON, // This will be updated when saving
            chain,
            direction: TransactionDirection.RECEIVED,
            fromAddress: tx.from.toLowerCase(),
            toAddress: tx.to.toLowerCase(),
            value: tx.rawContract?.value || '0',
            valueInEth,
            valueInUsd: valueInEth * usdRate,
            timestamp: tx.metadata?.blockTimestamp 
              ? new Date(tx.metadata.blockTimestamp).getTime() 
              : Date.now(),
            blockNumber: Number(tx.blockNum) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      logger.info(`Found ${transactions.length} ${chain} transactions for address: ${address}`);
      return transactions;
    } catch (error) {
      logger.error(`Error fetching ${chain} transactions for address: ${address}`, error);
      throw error;
    }
  }
}
