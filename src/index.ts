import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { transactionRoutes } from "./routes/transactions";
import { addressRoutes } from "./routes/addresses";
import { logger } from "./utils/logger";
import { connectToMongoDB } from "./utils/mongodb";
import { TransactionIndexerService } from "./services/transactionIndexerService";
import { AddressRepository } from "./models/addressRepository";
import { TransactionRepository } from "./models/transactionRepository";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/transactions", transactionRoutes);
app.use("/api/addresses", addressRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add test route redirects to maintain backward compatibility
app.get("/api/index-transactions", (req, res) => {
  res.redirect("/api/transactions/index");
});

app.get("/api/list-addresses", (req, res) => {
  res.redirect("/api/addresses/list");
});

app.get("/api/list-transactions", (req, res) => {
  res.redirect("/api/transactions/list");
});

app.get("/api/list-transactions/:address", (req, res) => {
  const address = req.params.address;
  res.redirect(`/api/transactions/list/${address}`);
});

// Start server if not imported
if (require.main === module) {
  // Connect to MongoDB before starting the server
  connectToMongoDB()
    .then(() => {
      app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      logger.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    });
}

export default app;
