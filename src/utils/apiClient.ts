import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { logger } from "./logger";

/**
 * Base API client for making HTTP requests
 */
export class ApiClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: AxiosRequestConfig = {}) {
    this.client = axios.create({
      baseURL,
      ...config,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      logger.debug(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`API Error: ${error.message}`, {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }
}
