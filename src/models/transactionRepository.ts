import { TransactionModel } from "./mongoSchemas";
import { Transaction, TransactionDirection } from "./transaction";
import { logger } from "../utils/logger";

export class TransactionRepository {
  /**
   * Save a transaction to the database
   */
  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const now = new Date().toISOString();
      const transactionData = {
        ...transaction,
        createdAt: transaction.createdAt || now,
        updatedAt: now,
      };

      // Check if transaction already exists
      const existingTransaction = await TransactionModel.findOne({
        id: transaction.id,
      }).exec();

      if (existingTransaction) {
        logger.debug(`Transaction already exists: ${transaction.id}`);
        return existingTransaction.toObject();
      }

      // Create new transaction
      const newTransaction = new TransactionModel(transactionData);
      await newTransaction.save();

      logger.debug(`Saved transaction: ${transaction.id}`);
      return newTransaction.toObject();
    } catch (error) {
      logger.error(`Error saving transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Batch save transactions to the database
   * Uses upsert operations to insert new transactions and update existing ones
   */
  async batchSaveTransactions(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) {
      return;
    }

    const now = new Date().toISOString();

    try {
      // Process transactions in batches for better performance
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        batches.push(batch);
      }

      let updatedCount = 0;
      let insertedCount = 0;

      for (const batch of batches) {
        // Prepare bulk write operations for each transaction
        const bulkOps = batch.map((transaction) => ({
          updateOne: {
            filter: { id: transaction.id },
            update: {
              $set: {
                ...transaction,
                createdAt: transaction.createdAt || now,
                updatedAt: now,
              },
            },
            upsert: true, // Create if it doesn't exist
          },
        }));

        // Execute bulk write operations
        const result = await TransactionModel.bulkWrite(bulkOps);

        // Track counts for logging
        if (result.upsertedCount) insertedCount += result.upsertedCount;
        if (result.modifiedCount) updatedCount += result.modifiedCount;
      }

      logger.debug(
        `Batch processed ${transactions.length} transactions: inserted ${insertedCount}, updated ${updatedCount}`
      );
    } catch (error) {
      logger.error(`Error batch saving transactions: ${error}`);
      throw error;
    }
  }

  /**
   * Get a transaction by its ID (hash)
   */
  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const transaction = await TransactionModel.findOne({ id }).exec();
      return transaction ? transaction.toObject() : null;
    } catch (error) {
      logger.error(`Error getting transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Get all transactions for a specific address
   */
  async getTransactionsByAddress(
    address: string,
    direction?: TransactionDirection
  ): Promise<Transaction[]> {
    try {
      // Create query object
      const query: any = { address };

      // Add direction filter if specified
      if (direction) {
        query.direction = direction;
      }

      // Find transactions and sort by timestamp in descending order
      const transactions = await TransactionModel.find(query)
        .sort({ timestamp: -1 })
        .exec();

      return transactions.map((tx) => tx.toObject());
    } catch (error) {
      logger.error(`Error getting transactions by address: ${error}`);
      throw error;
    }
  }

  /**
   * Get all transactions with pagination
   */
  async getAllTransactions(
    limit: number = 50,
    lastEvaluatedKey?: any,
    direction?: TransactionDirection
  ): Promise<{ transactions: Transaction[]; lastEvaluatedKey?: any }> {
    try {
      // Create query object
      const query: any = {};

      // Add direction filter if specified
      if (direction) {
        query.direction = direction;
      }

      // Create base query
      let transactionQuery = TransactionModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);

      // Add skip if lastEvaluatedKey is provided
      if (lastEvaluatedKey) {
        transactionQuery = transactionQuery.skip(parseInt(lastEvaluatedKey));
      }

      // Execute query
      const transactions = await transactionQuery.exec();

      // Calculate next lastEvaluatedKey
      const nextLastEvaluatedKey =
        transactions.length === limit
          ? (lastEvaluatedKey ? parseInt(lastEvaluatedKey) : 0) + limit
          : undefined;

      return {
        transactions: transactions.map((tx) => tx.toObject()),
        lastEvaluatedKey: nextLastEvaluatedKey?.toString(),
      };
    } catch (error) {
      logger.error(`Error getting all transactions: ${error}`);
      throw error;
    }
  }
}
