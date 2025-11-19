// This file acts as the "main" file for the `instructions` directory.

// 1. We declare each instruction file as a public module.
pub mod initialize_election;
pub mod cast_vote;
pub mod tally_results;

// 2. We use 'pub use' to re-export everything from them.
// This lets our `lib.rs` file easily access them.
pub use initialize_election::*;
pub use cast_vote::*;
pub use tally_results::*;