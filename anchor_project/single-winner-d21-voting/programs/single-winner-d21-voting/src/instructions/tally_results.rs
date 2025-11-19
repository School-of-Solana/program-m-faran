use anchor_lang::prelude::*;
use crate::state::ElectionAccount;
use crate::errors::ElectionError;
use crate::events::ElectionFinalized;

#[derive(Accounts)]
pub struct TallyResults<'info> {
    // We need to read and write to the election account
    // to set `is_finalized` and the `winner_index`.
    #[account(
        mut,
        // This 'constraint' ensures only the original 'authority'
        // saved in the account can call this function.
        has_one = authority
    )]
    pub election_account: Account<'info, ElectionAccount>,

    // The authority must sign the transaction.
    pub authority: Signer<'info>,

    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<TallyResults>) -> Result<()> {
    let election = &mut ctx.accounts.election_account;
    let current_timestamp = ctx.accounts.clock.unix_timestamp;

    // --- Rule Check 1: Election Has Ended ---
    require!(
        current_timestamp > election.end_timestamp,
        ElectionError::TallyNotAllowedYet
    );

    // --- Rule Check 2: Not Already Finalized ---
    require!(
        !election.is_finalized,
        ElectionError::ElectionAlreadyFinalized
    );

    // --- Find the Winner ---
    let mut max_votes = 0;
    // We use an Option in case there's a 0-vote tie (e.g., no votes cast)
    let mut winner_index: Option<u8> = None; 

    for (i, candidate) in election.candidates.iter().enumerate() {
        if candidate.vote_count > max_votes {
            max_votes = candidate.vote_count;
            winner_index = Some(i as u8);
        }
    }
    
    // NOTE: This simple logic defaults to the first candidate
    // in the list in the case of a tie. 
    // E.g., if A=5, B=5, winner is A (index 0).
    // A more complex system could handle ties (e.g., store Vec<u8>).
    // For D21, ties are rare, and this is sufficient.

    if let Some(index) = winner_index {
        // --- Finalize the Election ---
        election.is_finalized = true;
        election.winner_index = Some(index);
        
        let winner = &election.candidates[index as usize];

        // Emit final event
        emit!(ElectionFinalized {
            election: election.key(),
            winner_index: index,
            winner_name: winner.name.clone(),
            winner_vote_count: winner.vote_count,
            timestamp: current_timestamp,
        });

    } else {
        // This case happens if no votes were cast at all.
        // We still finalize it to prevent future voting.
        election.is_finalized = true;
        // winner_index remains None
    }

    Ok(())
}