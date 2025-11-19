use anchor_lang::prelude::*;

// --- 1. Import all our modules ---
// We declare them as public (`pub mod`) so the Anchor framework
// can see them, and we use `super::*` inside each module.

// Import the instruction logic
mod instructions;
use instructions::initialize_election::*;
use instructions::cast_vote::*;
use instructions::tally_results::*;

// Import the state structs
mod state;
use state::*;

// Import the custom errors
mod errors;
use errors::*;

// Import the events
mod events;
use events::*;


// --- 2. Declare the Program ID ---
declare_id!("EkhBeXScKHxKRbBud3mqCpK4aE7dnpNfCFKoPCDeCBDH");


// --- 3. Define the Program ---
// This `#[program]` block is the main router for our smart contract.
// Anchor will automatically create instruction handlers for each
// public function defined here.
#[program]
pub mod single_winner_d21_voting {
    
    // We must 'use super::*' here to bring all the imported
    // structs and handlers into this module's scope.
    use super::*;

    pub fn initialize_election(
        ctx: Context<InitializeElection>,
        start_timestamp: i64,
        end_timestamp: i64,
        candidate_names: Vec<String>,
        candidate_count: u8, 
    ) -> Result<()> {
        instructions::initialize_election::handler(
            ctx,
            start_timestamp,
            end_timestamp,
            candidate_names,
            candidate_count, 
        )
    }

    /// Instruction for a voter to cast their D21 votes.
    pub fn cast_vote(
        ctx: Context<CastVote>,
        candidate_indices: Vec<u8>,
    ) -> Result<()> {
        // This calls the 'handler' function in
        // `instructions/cast_vote.rs`
        instructions::cast_vote::handler(ctx, candidate_indices)
    }

    /// Instruction (for the authority) to tally the results
    /// and declare a winner after the election has ended.
    pub fn tally_results(ctx: Context<TallyResults>) -> Result<()> {
        // This calls the 'handler' function in
        // `instructions/tally_results.rs`
        instructions::tally_results::handler(ctx)
    }
}