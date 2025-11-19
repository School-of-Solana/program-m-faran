use anchor_lang::prelude::*;

// Sizing constants
pub const MAX_CANDIDATE_NAME_LEN: usize = 50; 
const DISCRIMINATOR_LEN: usize = 8;
pub const MAX_VOTES_PER_VOTER: u8 = 3;

// --- Struct 1: Candidate (Helper Struct) ---
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Candidate {
    pub name: String,
    pub vote_count: u64,
}

const CANDIDATE_SPACE: usize = (4 + MAX_CANDIDATE_NAME_LEN) + 8; 

// --- Struct 2: ElectionAccount (Main State) ---
#[account]
pub struct ElectionAccount {
    /// The authority (admin) who created and can end the election.
    pub authority: Pubkey,
    /// Unix timestamp when voting can begin.
    pub start_timestamp: i64,
    /// Unix timestamp when voting must end.
    pub end_timestamp: i64,
    /// The number of votes each person gets (e.g., 2).
    pub votes_per_voter: u8,
    /// Has the winner been declared?
    pub is_finalized: bool,
    /// The index of the winning candidate, if finalized.
    pub winner_index: Option<u8>,
    /// A list of all candidates.
    pub candidates: Vec<Candidate>,
}

impl ElectionAccount {
    pub fn get_space(candidate_count: u8) -> usize {
        DISCRIMINATOR_LEN
        + 32 // authority (Pubkey)
        + 8  // start_timestamp (i64)
        + 8  // end_timestamp (i64)
        + 1  // votes_per_voter (u8)
        + 1  // is_finalized (bool)
        + 1 + 1 // winner_index (Option<u8>)
        + 4 + (candidate_count as usize * CANDIDATE_SPACE) // 4 for Vec prefix + space for all candidates
    }
}


// --- Struct 3: VoterStateAccount (PDA per voter) ---
#[account]
pub struct VoterStateAccount {
    /// The wallet of the person who voted.
    pub voter_pubkey: Pubkey,
    /// Which election this ballot is for.
    pub election_pubkey: Pubkey,
    /// How many votes this person has used so far.
    pub votes_cast_count: u8,
    /// A list of candidate indices this user has *already* voted for.
    pub voted_for_indices: Vec<u8>,
}

impl VoterStateAccount {
    // This function is correct and does not need to change
    pub fn get_space() -> usize {
        DISCRIMINATOR_LEN
        + 32 // voter_pubkey (Pubkey)
        + 32 // election_pubkey (Pubkey)
        + 1  // votes_cast_count (u8)
        + 4 + (MAX_VOTES_PER_VOTER as usize) // Vec<u8> (4 bytes len + 1 byte per index * 3)
    }
}