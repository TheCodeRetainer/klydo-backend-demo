import { ApiClient } from '../utils/apiClient';
import { Address, AddressSource, Chain, Network } from '../models/address';
import { logger } from '../utils/logger';

interface BridgeCustomer {
  id: string;
  liquidationAddress: string;
  chain: string;
}

export class BridgeService extends ApiClient {
  constructor() {
    super('https://api.sandbox.bridge.xyz', {
      headers: {
        'x-api-key': process.env.BRIDGE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all liquidation addresses from Bridge
   */
  async getLiquidationAddresses(): Promise<Address[]> {
    try {
      logger.info('Fetching liquidation addresses from Bridge');
      
      // Check if BRIDGE_API_KEY is set
      if (!process.env.BRIDGE_API_KEY) {
        logger.warn('BRIDGE_API_KEY is not set in environment variables');
        return [];
      }
      
      // Fetch all customers from Bridge
      logger.debug('Making request to Bridge API: /customers');
      const response = await this.client.get('/customers');
      
      // Log response structure for debugging
      logger.debug(`Bridge API response structure: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
      const customers: BridgeCustomer[] = response.data.data || [];
      
      // Extract liquidation addresses
      const addresses: Address[] = [];
      
      for (const customer of customers) {
        if (customer.liquidationAddress) {
          // Determine chain based on the address format or metadata
          // For simplicity, we're assuming all are Ethereum mainnet
          // In a real implementation, you'd use the chain info from Bridge
          addresses.push({
            address: customer.liquidationAddress.toLowerCase(),
            source: AddressSource.BRIDGE,
            chain: Chain.ETHEREUM, // Default to Ethereum, adjust based on actual data
            network: Network.MAINNET,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      logger.info(`Found ${addresses.length} liquidation addresses from Bridge`);
      return addresses;
    } catch (error: any) {
      // Log detailed error information
      logger.error('Error fetching liquidation addresses from Bridge', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Return empty array instead of throwing error to prevent the entire collection process from failing
      logger.warn('Returning empty address array due to Bridge API error');
      return [];
    }
  }
}
