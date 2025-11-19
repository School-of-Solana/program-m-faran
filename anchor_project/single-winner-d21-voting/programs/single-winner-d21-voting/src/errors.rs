use anchor_lang::prelude::*;

#[error_code]
pub enum ElectionError {
    #[msg("The election has not started yet.")]
    ElectionNotStarted,

    #[msg("The election has already ended.")]
    ElectionAlreadyEnded,

    #[msg("The election has already been finalized and a winner declared.")]
    ElectionAlreadyFinalized,

    #[msg("Cannot tally results until the election has ended.")]
    TallyNotAllowedYet,

    #[msg("You have already used all your available votes.")]
    VotesExhausted,

    #[msg("You cannot vote for the same candidate more than once.")]
    AlreadyVotedForCandidate,
    
    #[msg("Your vote request contains duplicate candidates in the same transaction.")]
    DuplicateVoteInSingleTx,

    #[msg("The provided candidate index is invalid.")]
    InvalidCandidateIndex,

    #[msg("The provided candidate count does not match the candidate list length.")]
    CandidateCountMismatch,

    #[msg("A candidate name is too long.")]
    CandidateNameTooLong,
}