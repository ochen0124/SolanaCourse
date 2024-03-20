use solana_program::{program_error::ProgramError};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ReviewError{
    // Error 1
    #[error("Account not initialized yet")]
    UninitializedAccount,
    // Error 2
    #[error("PDA derived does not equal PDA passed in")]
    InvalidPDA,
    // Error 3
    #[error("Input data exceeds max length")]
    InvalidDataLength,
    // Error 4
    #[error("Rating greater than 5 or less than 1")]
    InvalidRating,
}

impl From<ReviewError> for ProgramError {
    fn from(e: ReviewError) -> Self {
        ProgramError::Custom(e as u32)
    }
}