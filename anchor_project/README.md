# D21 Voting Smart Contract (Anchor)

This directory contains the on-chain logic for the Single-Winner D21 Voting System, built using the **Anchor Framework**. It implements the core consensus algorithms and state management for the dApp.

## Core Features
- **Custom Voting Logic**: Dynamically calculates vote allowances based on candidate count (e.g., 7+ candidates = 3 votes).
- **Sybil Resistance**: Uses Program Derived Addresses (PDAs) to strictly enforce one-time voting per wallet per election.
- **Secure Tallying**: Time-locked tallying ensures elections cannot be finalized before the duration expires.

## Quick Start
1. **Build**: `anchor build`
2. **Test**: `anchor test` (Runs the TypeScript integration suite)
3. **Deploy**: `anchor deploy --provider.cluster devnet`

## Key Files
- `programs/single-winner-d21-voting/src/lib.rs`: Entry point routing instructions.
- `programs/single-winner-d21-voting/src/instructions/`: Business logic for `initialize`, `vote`, and `tally`.
- `programs/single-winner-d21-voting/src/state.rs`: Account data structures.