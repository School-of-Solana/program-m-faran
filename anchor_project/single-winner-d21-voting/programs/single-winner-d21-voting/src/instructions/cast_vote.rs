use anchor_lang::prelude::*;
use crate::state::{ElectionAccount, VoterStateAccount};
use crate::errors::ElectionError;
use crate::events::VoteCasted;

#[derive(Accounts)]
pub struct CastVote<'info> {
    // We need to read and write to the election account (to update vote counts).
    #[account(mut)]
    pub election_account: Account<'info, ElectionAccount>,

    // We need to create a `VoterStateAccount` (PDA) for the voter
    // if it's their first time, or load it if they've voted before.
    #[account(
        init_if_needed,
        payer = voter,
        // This PDA is seeded with "voter" and the user's/election's pubkeys
        // to make it unique for this user in this election.
        seeds = [
            b"voter".as_ref(),
            voter.key().as_ref(),
            election_account.key().as_ref()
        ],
        bump,
        space = VoterStateAccount::get_space()
    )]
    pub voter_state_account: Account<'info, VoterStateAccount>,

    // The voter must sign the transaction.
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<CastVote>,
    candidate_indices: Vec<u8>,
) -> Result<()> {
    let election = &mut ctx.accounts.election_account;
    let voter_state = &mut ctx.accounts.voter_state_account;
    let voter = &ctx.accounts.voter;
    let current_timestamp = ctx.accounts.clock.unix_timestamp;

    // --- Rule Check 1: Election is Active ---
    require!(
        current_timestamp > election.start_timestamp,
        ElectionError::ElectionNotStarted
    );
    require!(
        current_timestamp < election.end_timestamp,
        ElectionError::ElectionAlreadyEnded
    );
    require!(
        !election.is_finalized,
        ElectionError::ElectionAlreadyFinalized
    );

    // --- Rule Check 2: Input Validation ---
    require!(
        !candidate_indices.is_empty(),
        ElectionError::InvalidCandidateIndex
    );
    // Check for duplicate indices *in this single transaction*
    let mut unique_indices = candidate_indices.clone();
    unique_indices.sort();
    unique_indices.dedup();
    require!(
        unique_indices.len() == candidate_indices.len(),
        ElectionError::DuplicateVoteInSingleTx
    );

    // --- Rule Check 3: Voter Has Votes Remaining ---
    let votes_to_cast = candidate_indices.len() as u8;
    let new_vote_count = voter_state.votes_cast_count.checked_add(votes_to_cast)
        .ok_or(ElectionError::VotesExhausted)?; // Handles overflow
        
    require!(
        new_vote_count <= election.votes_per_voter,
        ElectionError::VotesExhausted
    );

    // If this is a new VoterStateAccount, initialize its fields
    if voter_state.votes_cast_count == 0 && voter_state.voter_pubkey == Pubkey::default() {
        voter_state.voter_pubkey = *voter.key;
        voter_state.election_pubkey = election.key();
    }

    // --- Rule Check 4 & Vote Recording ---
    for &index in &candidate_indices {
        let candidate_index = index as usize;

        // Check if index is valid
        require!(
            candidate_index < election.candidates.len(),
            ElectionError::InvalidCandidateIndex
        );

        // D21 Rule: Check if already voted for this candidate
        require!(
            !voter_state.voted_for_indices.contains(&index),
            ElectionError::AlreadyVotedForCandidate
        );

        // All checks pass! Record the vote.
        election.candidates[candidate_index].vote_count += 1;
        voter_state.voted_for_indices.push(index);
    }
    
    // Update the voter's total cast votes
    voter_state.votes_cast_count = new_vote_count;

    // Emit an event for the frontend
    emit!(VoteCasted {
        voter: *voter.key,
        election: election.key(),
        candidates_voted_for: candidate_indices,
        timestamp: current_timestamp,
    });

    Ok(())
}