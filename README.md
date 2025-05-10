# Klydo Backend

The backend service for the Klydo Transaction Indexer, responsible for collecting Ethereum & Base (Mainnet) addresses from multiple sources, indexing on-chain transactions, and providing API endpoints for the frontend.

## Technology Stack

- Node.js 18 with TypeScript
- Express.js for API endpoints
- AWS DynamoDB for data storage
- AWS Lambda for serverless deployment
- Scheduled jobs for address collection and transaction indexing

## Project Structure

```
backend/
├── src/
│   ├── index.ts       # Main entry point
│   ├── models/        # Data models and repositories
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   └── utils/         # Utility functions
├── package.json
├── tsconfig.json
└── serverless.yml     # Serverless deployment config
```

## Setup Instructions

### Prerequisites

- Node.js 18 or later
- AWS account with appropriate permissions
- Alchemy API key
- Privy API key (sandbox)
- Bridge API key (sandbox)

### Installation

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the backend directory using the `.env.example` as a template:

   ```
   PRIVY_API_KEY=your_privy_api_key
   BRIDGE_API_KEY=your_bridge_api_key
   ALCHEMY_API_KEY=your_alchemy_api_key
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   NODE_ENV=development
   PORT=3001
   JSON_FEED_URL=https://gist.github.com/benbuschmann/18500244ac1e42dacf1d9bd5e88338cd/raw
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Transactions

- `GET /api/transactions` - Get all transactions with optional filtering
- `GET /api/transactions/address/:address` - Get transactions for a specific address
- `POST /api/transactions/index` - Trigger transaction indexing

### Addresses

- `GET /api/addresses` - Get all addresses
- `POST /api/addresses/collect` - Trigger address collection

## Address Collection

The backend automatically collects addresses from three sources:

- Privy (Sandbox) - wallet addresses for users in the sandbox app
- Bridge (Sandbox) - liquidation addresses for customers
- JSON feed - addresses published at a public URL

Address collection happens automatically when transactions are requested from the frontend.

## Deployment

### Deployment to AWS

1. Configure AWS credentials:

   ```
   aws configure
   ```

2. Deploy to AWS:
   ```
   npx serverless deploy
   ```

## Scripts

- `npm run dev` - Run the development server
- `npm run build` - Build the project
- `npm run start` - Start the production server
- `npm run test` - Run tests

## License

This project is licensed under the MIT License.
