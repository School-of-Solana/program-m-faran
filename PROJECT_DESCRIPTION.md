# Project Description

**Deployed Frontend URL:** *[https://voting-solana-frontend.vercel.app/]*
**Solana Program ID:** `EkhBeXScKHxKRbBud3mqCpK4aE7dnpNfCFKoPCDeCBDH`

---

## Project Overview

### Description

A decentralized voting application implementing the **D21 (Janeček) Voting Method** on the Solana blockchain. Unlike traditional "one person, one vote" systems, D21 allows voters to cast multiple votes for different candidates (but only one per candidate) to maximize consensus in a group.

This Single-Winner implementation automatically calculates how many votes each voter gets based on the number of candidates running. It includes time-locked elections, anti-double-voting security, and transparent on-chain tallying.

### Key Features

* **Consensus Voting Logic**: Automatically assigns 1, 2, or 3 votes per voter depending on the number of candidates (e.g., 7+ candidates → 3 votes).
* **Time-Locked Elections**: Voting is restricted to a specific start and end time.
* **Sybil Resistance**: PDAs prevent double voting or exceeding vote limits.
* **Admin Controls**: Election authority can initialize ballots and perform the final tally.
* **Real-Time Dashboard**: React/Tailwind UI for creating elections, viewing stats, and voting.

### How to Use the dApp

1. **Connect Wallet** (Phantom/Solflare on Devnet).
2. **Create Election** as an admin by entering candidates and duration.
3. **Vote** by selecting allowed candidates (up to the system-calculated limit).
4. **Tally** the final result after the election ends.

---

## Program Architecture

The program uses structured account types and PDAs to ensure secure, rule-enforced voting.

### PDA Usage

PDAs track voter activity to prevent double voting.

**PDAs Used:**

* **Voter State PDA**
  **Seeds:** `["voter", user_pubkey, election_pubkey]`
  **Purpose:** Records number of votes used and which candidates were selected.

---

## Program Instructions

### Implemented Instructions

* **Initialize Election**
  Creates election account, sets timing, and determines allowed votes per voter.

* **Cast Vote**
  Validates timing, vote count, and prevents duplicate selections.

* **Tally Results**
  Calculates the winning candidate after the end timestamp and freezes the election.

---

## Account Structure

### Election Account (Global State)

```rust
#[account]
pub struct ElectionAccount {
    pub authority: Pubkey,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub votes_per_voter: u8,
    pub is_finalized: bool,
    pub winner_index: Option<u8>,
    pub candidates: Vec<Candidate>, 
}
```

### Voter State Account (Individual Ballot)

```rust
#[account]
pub struct VoterStateAccount {
    pub voter_pubkey: Pubkey,
    pub election_pubkey: Pubkey,
    pub votes_cast_count: u8,
    pub voted_for_indices: Vec<u8>,
}
```

---

## Testing

### Test Coverage

The project includes a comprehensive TypeScript test suite covering all instructions in the D21 voting logic.

#### ✔️ Happy Path

* Elections initialize correctly with proper vote-per-voter rules.
* Partial then full voting is supported.
* Admin can finalize elections and winner is computed correctly.

#### ❌ Unhappy Path

* Over-voting attempts fail.
* Duplicate candidate votes fail.
* Voting outside time window fails.
* Unauthorized tally attempts fail.
* Oversized candidate names are rejected.

### Running Tests

```bash
npm install
anchor test
```

---

## Additional Notes for Evaluators

This was my first Solana dApp and the learning curve was steep! 

---
