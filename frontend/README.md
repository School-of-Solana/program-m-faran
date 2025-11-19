# D21 Voting DApp (Frontend)

This is the client-side interface for the D21 Voting System, generated with `create-solana-dapp`. It allows users to interact with the deployed smart contract via their browser wallets.

## Features
- **Wallet Integration**: Seamless connection with Phantom, Solflare, and other Solana adapters.
- **Admin Dashboard**: Create new elections with custom candidate lists and durations.
- **Voting Interface**: Real-time loading of election data, candidate selection, and transaction submission.
- **Live Tallying**: Visual indicators for election status, vote counts, and winners.

## Setup & Run
1. **Install Dependencies**: `npm install`
2. **Run Locally**: `npm run dev` -> Open `http://localhost:3000`

## Key Files
1. `src/components/dashboard/dashboard-feature.tsx`