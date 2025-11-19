use anchor_lang::prelude::*;
use crate::state::{ElectionAccount, Candidate, MAX_CANDIDATE_NAME_LEN};
use crate::errors::ElectionError;

#[derive(Accounts)]
#[instruction(
    start_timestamp: i64,
    end_timestamp: i64,
    candidate_names: Vec<String>,
    candidate_count: u8
)]
pub struct InitializeElection<'info> {
    #[account(
        init,
        payer = authority,
        space = ElectionAccount::get_space(candidate_count)
    )]
    pub election_account: Account<'info, ElectionAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeElection>,
    start_timestamp: i64,
    end_timestamp: i64,
    candidate_names: Vec<String>,
    candidate_count: u8, 
) -> Result<()> {
    require_eq!(
        candidate_count as usize,
        candidate_names.len(),
        ElectionError::CandidateCountMismatch
    );

    let election_account = &mut ctx.accounts.election_account;

    // This D21 logic is still correct
    let num_candidates = candidate_names.len();
    let calculated_votes = if num_candidates >= 7 { 3 } else { 2 };

    let mut candidates = Vec::new();
    for name in candidate_names {
        require!(
            name.len() <= MAX_CANDIDATE_NAME_LEN,
            ElectionError::CandidateNameTooLong
        );
        candidates.push(Candidate {
            name,
            vote_count: 0,
        });
    }

    election_account.authority = *ctx.accounts.authority.key;
    election_account.start_timestamp = start_timestamp;
    election_account.end_timestamp = end_timestamp;
    election_account.votes_per_voter = calculated_votes;
    election_account.is_finalized = false;
    election_account.winner_index = None;
    election_account.candidates = candidates;

    Ok(())
}