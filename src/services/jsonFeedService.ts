import axios from 'axios';
import NodeCache from 'node-cache';
import { Address, AddressSource, Chain, Network } from '../models/address';
import { logger } from '../utils/logger';

interface JsonFeedAddress {
  address: string;
  chain: string;
  network: string;
}

interface JsonFeedResponse {
  addresses: JsonFeedAddress[];
}

export class JsonFeedService {
  private url: string;
  private cache: NodeCache;
  private etag: string | null = null;
  private lastModified: string | null = null;

  constructor() {
    this.url = process.env.JSON_FEED_URL || 'https://gist.github.com/benbuschmann/18500244ac1e42dacf1d9bd5e88338cd/raw';
    // Cache with TTL of 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  /**
   * Get all addresses from the JSON feed
   */
  async getAddresses(): Promise<Address[]> {
    try {
      logger.info('Fetching addresses from JSON feed');
      
      // Check if we have cached addresses
      const cachedAddresses = this.cache.get<Address[]>('addresses');
      if (cachedAddresses) {
        logger.debug('Using cached addresses from JSON feed');
        return cachedAddresses;
      }
      
      // Prepare request headers for conditional GET
      const headers: Record<string, string> = {};
      if (this.etag) {
        headers['If-None-Match'] = this.etag;
      }
      if (this.lastModified) {
        headers['If-Modified-Since'] = this.lastModified;
      }
      
      logger.debug(`Making request to JSON feed URL: ${this.url}`);
      
      // Fetch addresses from JSON feed
      const response = await axios.get<JsonFeedResponse>(this.url, { headers, timeout: 10000 });
      
      // Update ETag and Last-Modified for future requests
      if (response.headers.etag) {
        this.etag = response.headers.etag;
      }
      if (response.headers['last-modified']) {
        this.lastModified = response.headers['last-modified'];
      }
      
      // Process addresses
      const addresses: Address[] = [];
      
      logger.debug(`JSON feed response data: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
      if (response.data && response.data.addresses) {
        for (const item of response.data.addresses) {
          if (
            item.address && 
            (item.chain === 'ethereum' || item.chain === 'base') && 
            item.network === 'mainnet'
          ) {
            addresses.push({
              address: item.address.toLowerCase(),
              source: AddressSource.JSON,
              chain: item.chain === 'ethereum' ? Chain.ETHEREUM : Chain.BASE,
              network: Network.MAINNET,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        logger.warn('JSON feed response does not contain expected addresses array structure');
      }
      
      // Cache the addresses
      this.cache.set('addresses', addresses);
      
      logger.info(`Found ${addresses.length} addresses from JSON feed`);
      return addresses;
    } catch (error: any) {
      // If the resource hasn't changed (304 Not Modified), return cached addresses
      if (error.response && error.response.status === 304) {
        logger.debug('JSON feed not modified, using cached addresses');
        const cachedAddresses = this.cache.get<Address[]>('addresses');
        return cachedAddresses || [];
      }
      
      // Log detailed error information
      logger.error('Error fetching addresses from JSON feed', {
        message: error.message,
        url: this.url,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Return empty array instead of throwing error to prevent the entire collection process from failing
      logger.warn('Returning empty address array due to JSON feed error');
      return [];
    }
  }
}
