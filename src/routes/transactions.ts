import express from "express";
// Define types for Express Request and Response
type Request = any;
type Response = any;
import { TransactionIndexerService } from "../services/transactionIndexerService";
import { AddressCollectorService } from "../services/addressCollectorService";
import { TransactionRepository } from "../models/transactionRepository";
import { logger } from "../utils/logger";

export const transactionRoutes = express.Router();
const transactionService = new TransactionIndexerService();
const addressService = new AddressCollectorService();
const transactionRepo = new TransactionRepository();

/**
 * Helper function to collect addresses from all sources
 */
async function collectAndUpdateAddresses() {
  try {
    logger.info("Collecting addresses from all sources");
    const addressResult = await addressService.collectAddresses();
    logger.info(
      `Collected ${addressResult.total} addresses (${addressResult.new} new) from all sources`
    );
    return addressResult;
  } catch (error) {
    logger.warn("Address collection failed", error);
    return { total: 0, new: 0 };
  }
}

/**
 * Get all transactions with optional filtering and pagination
 * Automatically collects addresses from all sources and indexes the latest transactions
 */
transactionRoutes.get("/", async (req: any, res: any) => {
  try {
    // Always index transactions for all addresses to get the latest data
    logger.info("Indexing latest transactions for all addresses");
    const indexResult = await transactionService.indexAllAddresses();
    logger.info(
      `Indexed ${indexResult.transactions} transactions for ${indexResult.addresses} addresses`
    );

    // Now proceed with getting transactions
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const lastEvaluatedKey = req.query.lastEvaluatedKey
      ? JSON.parse(decodeURIComponent(req.query.lastEvaluatedKey as string))
      : undefined;
    const direction = req.query.direction as "sent" | "received" | undefined;

    const result = await transactionService.getAllTransactions(
      limit,
      lastEvaluatedKey,
      direction
    );

    res.json({
      transactions: result.transactions,
      lastEvaluatedKey: result.lastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(result.lastEvaluatedKey))
        : undefined,
    });
  } catch (error) {
    logger.error("Error getting transactions", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

/**
 * Get transactions for a specific address
 * Automatically collects addresses from all sources and indexes the latest transactions
 */
transactionRoutes.get("/address/:address", async (req: any, res: any) => {
  try {
    const { address } = req.params;

    // First, collect addresses from all sources
    await collectAndUpdateAddresses();

    // Index latest transactions for the specific address
    logger.info(`Indexing latest transactions for address: ${address}`);
    await transactionService.indexAddressTransactions({
      address,
      source: "json",
      chain: "ethereum",
      network: "mainnet",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Now proceed with getting transactions
    const direction = req.query.direction as "sent" | "received" | undefined;

    const transactions = await transactionService.getTransactionsByAddress(
      address,
      direction
    );

    res.json({ transactions });
  } catch (error) {
    logger.error(
      `Error getting transactions for address: ${req.params.address}`,
      error
    );
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

/**
 * Manually trigger transaction indexing for all addresses
 */
transactionRoutes.post("/index", async (req: any, res: any) => {
  try {
    const result = await transactionService.indexAllAddresses();
    res.json(result);
  } catch (error) {
    logger.error("Error indexing transactions", error);
    res.status(500).json({ error: "Failed to index transactions" });
  }
});

/**
 * Test endpoint to list all transactions in the database
 */
transactionRoutes.get("/list", async (req: any, res: any) => {
  try {
    logger.info("Listing transactions in the database");
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const result = await transactionRepo.getAllTransactions(limit);
    res.status(200).json({
      success: true,
      count: result.transactions.length,
      hasMore: !!result.lastEvaluatedKey,
      transactions: result.transactions,
    });
  } catch (error: any) {
    logger.error("Error listing transactions", error);
    res.status(500).json({
      success: false,
      message: "Failed to list transactions",
      error: error.message,
    });
  }
});

/**
 * Test endpoint to list transactions for a specific address directly from repository
 */
transactionRoutes.get("/list/:address", async (req: any, res: any) => {
  try {
    const address = req.params.address;
    logger.info(`Listing transactions for address: ${address}`);
    const transactions = await transactionRepo.getTransactionsByAddress(address);
    res.status(200).json({
      success: true,
      count: transactions.length,
      address,
      transactions,
    });
  } catch (error: any) {
    logger.error(
      `Error listing transactions for address: ${req.params.address}`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to list transactions for address",
      error: error.message,
    });
  }
});
