import mongoose, { ConnectOptions } from "mongoose";
import { logger } from "./logger";

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/klydo";

// MongoDB connection options
const mongooseOptions: ConnectOptions = {
  autoCreate: true, // Create collections automatically
  autoIndex: true, // Create indexes automatically
  connectTimeoutMS: 30000, // Increase connection timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
  serverSelectionTimeoutMS: 30000, // Increase server selection timeout to 30 seconds
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  minPoolSize: 1, // Minimum number of connections in the connection pool
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  retryWrites: true, // Retry write operations if they fail
};

// Connect to MongoDB
export async function connectToMongoDB(): Promise<void> {
  try {
    // Log the MongoDB URI (without credentials)
    const sanitizedUri = MONGODB_URI.includes("@")
      ? `mongodb+srv://${MONGODB_URI.split("@")[1]}`
      : MONGODB_URI.replace(/:\/\/.*?:.*?@/, "://***:***@");

    logger.info(`Connecting to MongoDB at ${sanitizedUri}`);

    // Set up connection event listeners
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connection established successfully");
    });

    mongoose.connection.on("error", (err: Error) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection disconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    logger.info(`Connected to MongoDB at ${sanitizedUri}`);
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Disconnect from MongoDB
export async function disconnectFromMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}

// Export mongoose for use in models
export { mongoose };
