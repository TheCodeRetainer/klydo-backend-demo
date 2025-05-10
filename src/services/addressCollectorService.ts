import { PrivyService } from "./privyService";
import { BridgeService } from "./bridgeService";
import { JsonFeedService } from "./jsonFeedService";
import { AddressRepository } from "../models/addressRepository";
import { Address } from "../models/address";
import { logger } from "../utils/logger";

export class AddressCollectorService {
  private privyService: PrivyService;
  private bridgeService: BridgeService;
  private jsonFeedService: JsonFeedService;
  private addressRepository: AddressRepository;

  constructor() {
    this.privyService = new PrivyService();
    this.bridgeService = new BridgeService();
    this.jsonFeedService = new JsonFeedService();
    this.addressRepository = new AddressRepository();
  }

  /**
   * Collect addresses from all sources and save to database
   */
  async collectAddresses(): Promise<{ total: number; new: number }> {
    logger.info("Starting address collection from all sources");

    try {
      // Collect addresses from all sources, handling each separately to prevent one failure from affecting others
      let privyAddresses: Address[] = [];
      let bridgeAddresses: Address[] = [];
      let jsonAddresses: Address[] = [];

      try {
        privyAddresses = await this.privyService.getWalletAddresses();
        logger.info(`Collected ${privyAddresses.length} addresses from Privy`);
      } catch (error) {
        logger.error("Failed to collect addresses from Privy", error);
      }

      try {
        bridgeAddresses = await this.bridgeService.getLiquidationAddresses();
        logger.info(
          `Collected ${bridgeAddresses.length} addresses from Bridge`
        );
      } catch (error) {
        logger.error("Failed to collect addresses from Bridge", error);
      }

      try {
        jsonAddresses = await this.jsonFeedService.getAddresses();
        logger.info(
          `Collected ${jsonAddresses.length} addresses from JSON feed`
        );
      } catch (error) {
        logger.error("Failed to collect addresses from JSON feed", error);
      }

      // Combine all addresses
      const allAddresses = [
        ...privyAddresses,
        ...bridgeAddresses,
        ...jsonAddresses,
      ];

      logger.info(
        `Collected ${allAddresses.length} addresses from all sources`
      );

      // If no addresses were collected, log a warning but don't fail
      if (allAddresses.length === 0) {
        logger.warn("No addresses were collected from any source");
        return { total: 0, new: 0 };
      }

      // Save addresses to database
      let newAddressCount = 0;
      let errorCount = 0;

      for (const address of allAddresses) {
        try {
          // Check if address already exists
          const existingAddress = await this.addressRepository.getAddress(
            address.address
          );

          if (!existingAddress) {
            await this.addressRepository.saveAddress(address);
            newAddressCount++;
          } else {
            // Update the address if needed (e.g., if source changed)
            if (existingAddress.source !== address.source) {
              await this.addressRepository.saveAddress({
                ...existingAddress,
                source: address.source,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          logger.error(`Error saving address ${address.address}`, error);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        logger.warn(`Failed to save ${errorCount} addresses due to errors`);
      }

      logger.info(`Saved ${newAddressCount} new addresses to database`);

      return {
        total: allAddresses.length,
        new: newAddressCount,
      };
    } catch (error) {
      logger.error("Unexpected error collecting addresses", error);
      // Return partial success instead of throwing
      return { total: 0, new: 0 };
    }
  }

  /**
   * Get all addresses from the database
   */
  async getAllAddresses(): Promise<Address[]> {
    return this.addressRepository.getAllAddresses();
  }
}
