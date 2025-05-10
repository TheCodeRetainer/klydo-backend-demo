import express from "express";
import { AddressCollectorService } from "../services/addressCollectorService";
import { AddressRepository } from "../models/addressRepository";
import { logger } from "../utils/logger";

export const addressRoutes = express.Router();
const addressService = new AddressCollectorService();
const addressRepo = new AddressRepository();

/**
 * Get all addresses
 */
addressRoutes.get("/", async (req, res) => {
  try {
    const addresses = await addressService.getAllAddresses();
    res.json({ addresses });
  } catch (error) {
    logger.error("Error getting addresses", error);
    res.status(500).json({ error: "Failed to get addresses" });
  }
});

/**
 * Manually trigger address collection
 */
addressRoutes.post("/collect", async (req, res) => {
  try {
    const result = await addressService.collectAddresses();
    res.json(result);
  } catch (error) {
    logger.error("Error collecting addresses", error);
    res.status(500).json({ error: "Failed to collect addresses" });
  }
});

/**
 * Test endpoint to list all addresses in the database
 */
addressRoutes.get("/list", async (req, res) => {
  try {
    logger.info("Listing all addresses in the database");
    const addresses = await addressRepo.getAllAddresses();
    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error: any) {
    logger.error("Error listing addresses", error);
    res.status(500).json({
      success: false,
      message: "Failed to list addresses",
      error: error.message,
    });
  }
});
