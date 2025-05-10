import { AddressModel } from './mongoSchemas';
import { Address } from './address';
import { logger } from '../utils/logger';

export class AddressRepository {
  /**
   * Save an address to the database
   */
  async saveAddress(address: Address): Promise<Address> {
    try {
      const now = new Date().toISOString();
      const addressData = {
        ...address,
        createdAt: address.createdAt || now,
        updatedAt: now,
      };

      // Check if address already exists
      const existingAddress = await AddressModel.findOne({ address: address.address }).exec();
      
      if (existingAddress) {
        logger.debug(`Address already exists: ${address.address}`);
        return existingAddress.toObject();
      }

      // Create new address
      const newAddress = new AddressModel(addressData);
      await newAddress.save();
      
      logger.debug(`Saved address: ${address.address}`);
      return newAddress.toObject();
    } catch (error) {
      logger.error(`Error saving address: ${error}`);
      throw error;
    }
  }

  /**
   * Get an address by its value
   */
  async getAddress(address: string): Promise<Address | null> {
    try {
      const result = await AddressModel.findOne({ address }).exec();
      return result ? result.toObject() : null;
    } catch (error) {
      logger.error(`Error getting address: ${error}`);
      throw error;
    }
  }

  /**
   * Get all addresses from a specific source
   */
  async getAddressesBySource(source: string): Promise<Address[]> {
    try {
      const addresses = await AddressModel.find({ source }).exec();
      return addresses.map(address => address.toObject());
    } catch (error) {
      logger.error(`Error getting addresses by source: ${error}`);
      throw error;
    }
  }

  /**
   * Get all addresses
   */
  async getAllAddresses(): Promise<Address[]> {
    try {
      const addresses = await AddressModel.find({}).exec();
      return addresses.map(address => address.toObject());
    } catch (error) {
      logger.error(`Error getting all addresses: ${error}`);
      throw error;
    }
  }

  /**
   * Update the last indexed timestamp for an address
   */
  async updateLastIndexedAt(address: string, timestamp: string): Promise<void> {
    try {
      const result = await AddressModel.updateOne(
        { address },
        { 
          lastIndexedAt: timestamp,
          updatedAt: new Date().toISOString() 
        }
      ).exec();
      
      if (result.modifiedCount > 0) {
        logger.debug(`Updated lastIndexedAt for address: ${address}`);
      } else {
        logger.debug(`Address doesn't exist: ${address}`);
      }
    } catch (error) {
      logger.error(`Error updating lastIndexedAt: ${error}`);
      throw error;
    }
  }
}
