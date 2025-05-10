import { ApiClient } from '../utils/apiClient';
import { Address, AddressSource, Chain, Network } from '../models/address';
import { logger } from '../utils/logger';

interface PrivyWallet {
  address: string;
  chain: string;
  walletClientType: string;
  walletClientId: string;
  verifiedAt: string | null;
  linked: boolean;
}

interface PrivyUser {
  id: string;
  linkedAccounts: {
    wallets: PrivyWallet[];
  };
}

export class PrivyService extends ApiClient {
  constructor() {
    super('https://auth.privy.io/api/v1', {
      headers: {
        Authorization: `Bearer ${process.env.PRIVY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all wallet addresses from Privy
   */
  async getWalletAddresses(): Promise<Address[]> {
    try {
      logger.info('Fetching wallet addresses from Privy');
      
      // Check if PRIVY_API_KEY is set
      if (!process.env.PRIVY_API_KEY) {
        logger.warn('PRIVY_API_KEY is not set in environment variables');
        return [];
      }
      
      // Fetch all users from Privy
      logger.debug('Making request to Privy API: /users');
      const response = await this.client.get('/users');
      
      // Log response structure for debugging
      logger.debug(`Privy API response structure: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
      const users: PrivyUser[] = response.data.data || [];
      
      // Extract wallet addresses
      const addresses: Address[] = [];
      
      for (const user of users) {
        const wallets = user.linkedAccounts?.wallets || [];
        
        for (const wallet of wallets) {
          // Only include Ethereum and Base mainnet addresses
          if (
            wallet.address && 
            (wallet.chain === 'ethereum' || wallet.chain === 'base')
          ) {
            addresses.push({
              address: wallet.address.toLowerCase(),
              source: AddressSource.PRIVY,
              chain: wallet.chain === 'ethereum' ? Chain.ETHEREUM : Chain.BASE,
              network: Network.MAINNET,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
      
      logger.info(`Found ${addresses.length} wallet addresses from Privy`);
      return addresses;
    } catch (error: any) {
      // Log detailed error information
      logger.error('Error fetching wallet addresses from Privy', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Return empty array instead of throwing error to prevent the entire collection process from failing
      logger.warn('Returning empty address array due to Privy API error');
      return [];
    }
  }
}
