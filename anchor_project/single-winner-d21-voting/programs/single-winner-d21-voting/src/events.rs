use anchor_lang::prelude::*;

#[event]
pub struct VoteCasted {
    /// The wallet of the voter.
    pub voter: Pubkey,
    /// The election they voted in.
    pub election: Pubkey,
    /// The list of candidate indices they just voted for.
    pub candidates_voted_for: Vec<u8>,
    /// The timestamp of the vote.
    pub timestamp: i64,
}

#[event]
pub struct ElectionFinalized {
    /// The election that was finalized.
    pub election: Pubkey,
    /// The index of the winning candidate.
    pub winner_index: u8,
    /// The name of the winning candidate.
    pub winner_name: String,
    /// The total votes the winner received.
    pub winner_vote_count: u64,
    /// The timestamp of the finalization.
    pub timestamp: i64,
}