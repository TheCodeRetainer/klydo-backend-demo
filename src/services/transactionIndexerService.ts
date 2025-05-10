import { AlchemyService } from "./alchemyService";
import { AddressRepository } from "../models/addressRepository";
import { TransactionRepository } from "../models/transactionRepository";
import { Address, AddressSource } from "../models/address";
import { Transaction } from "../models/transaction";
import { logger } from "../utils/logger";

export class TransactionIndexerService {
  private alchemyService: AlchemyService;
  private addressRepository: AddressRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.alchemyService = new AlchemyService();
    this.addressRepository = new AddressRepository();
    this.transactionRepository = new TransactionRepository();
  }

  /**
   * Index transactions for all addresses
   * Always fetches the latest transactions for all addresses
   */
  async indexAllAddresses(): Promise<{
    addresses: number;
    transactions: number;
  }> {
    logger.info("Starting transaction indexing for all addresses");

    try {
      // Check if Alchemy API key is set
      if (!process.env.ALCHEMY_API_KEY) {
        logger.error("ALCHEMY_API_KEY is not set in environment variables");
        return { addresses: 0, transactions: 0 };
      }

      // Get all addresses from the database
      const addresses = await this.addressRepository.getAllAddresses();
      logger.info(`Found ${addresses.length} addresses to index`);
      
      // Log the first few addresses for debugging
      if (addresses.length > 0) {
        logger.debug(`Sample addresses: ${JSON.stringify(addresses.slice(0, 3))}`);
      } else {
        logger.warn("No addresses found in the database to index");
        return { addresses: 0, transactions: 0 };
      }

      let totalTransactions = 0;

      // Process addresses in batches to avoid rate limiting
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        batches.push(batch);
      }

      for (const [batchIndex, batch] of batches.entries()) {
        logger.info(
          `Processing batch ${batchIndex + 1}/${batches.length} (${
            batch.length
          } addresses)`
        );

        // Process each address in the batch - always fetch latest transactions
        const batchPromises = batch.map((address) =>
          this.indexAddressTransactions(address)
        );
        const batchResults = await Promise.all(batchPromises);

        // Sum up the total transactions
        totalTransactions += batchResults.reduce(
          (sum, count) => sum + count,
          0
        );
      }

      logger.info(
        `Indexed ${totalTransactions} transactions for ${addresses.length} addresses`
      );

      return {
        addresses: addresses.length,
        transactions: totalTransactions,
      };
    } catch (error: any) {
      logger.error("Error indexing transactions", {
        message: error.message,
        stack: error.stack
      });
      // Return partial success instead of throwing
      return { addresses: 0, transactions: 0 };
    }
  }

  /**
   * Index transactions for a single address
   * Always fetches the latest transactions from the blockchain
   */
  async indexAddressTransactions(address: Address): Promise<number> {
    logger.debug(`Indexing latest transactions for address: ${address.address}`);

    try {
      // Get latest transactions from both chains
      const [ethereumTransactions, baseTransactions] = await Promise.all([
        this.alchemyService.getEthereumTransactions(address.address),
        this.alchemyService.getBaseTransactions(address.address),
      ]);

      // Combine transactions and set the source
      // Convert string source to enum
      const sourceEnum =
        AddressSource[
          address.source.toUpperCase() as keyof typeof AddressSource
        ];

      const allTransactions = [
        ...ethereumTransactions.map((tx) => ({
          ...tx,
          source: sourceEnum,
          updatedAt: new Date().toISOString(), // Update timestamp to reflect latest fetch
        })),
        ...baseTransactions.map((tx) => ({
          ...tx,
          source: sourceEnum,
          updatedAt: new Date().toISOString(), // Update timestamp to reflect latest fetch
        })),
      ];

      // Save transactions to database
      if (allTransactions.length > 0) {
        // Use batch save to efficiently update the database with latest transactions
        await this.transactionRepository.batchSaveTransactions(allTransactions);
        logger.debug(`Saved ${allTransactions.length} latest transactions for address: ${address.address}`);
      } else {
        logger.debug(`No new transactions found for address: ${address.address}`);
      }

      // Update the last indexed timestamp for the address
      await this.addressRepository.updateLastIndexedAt(
        address.address,
        new Date().toISOString()
      );

      return allTransactions.length;
    } catch (error) {
      logger.error(
        `Error indexing transactions for address: ${address.address}`,
        error
      );
      // Don't throw the error, just log it and continue with other addresses
      return 0;
    }
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(
    limit: number = 50,
    lastEvaluatedKey?: any,
    direction?: "sent" | "received"
  ): Promise<{ transactions: Transaction[]; lastEvaluatedKey?: any }> {
    try {
      return await this.transactionRepository.getAllTransactions(
        limit,
        lastEvaluatedKey,
        direction as any
      );
    } catch (error: any) {
      logger.error(`Error in getAllTransactions: ${error.message}`);
      // Return empty results instead of throwing an error
      return { transactions: [], lastEvaluatedKey: undefined };
    }
  }

  /**
   * Get transactions for a specific address
   */
  async getTransactionsByAddress(
    address: string,
    direction?: "sent" | "received"
  ): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.getTransactionsByAddress(
        address,
        direction as any
      );
    } catch (error: any) {
      logger.error(
        `Error in getTransactionsByAddress for ${address}: ${error.message}`
      );
      // Return empty results instead of throwing an error
      return [];
    }
  }
}
