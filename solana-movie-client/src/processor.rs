use solana_program::{
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    account_info::{next_account_info, AccountInfo},
    system_instruction,
    program_error::ProgramError,
    sysvar::{Sysvar, rent::Rent},
    program::invoke_signed,
    borsh::try_from_slice_unchecked,
};
use std::convert::TryInto;
use crate::instruction::MovieInstruction;
use crate::state::MovieAccountState;
use borsh::BorshSerialize;
use crate::error::ReviewError;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult{
    msg!("Hi, crypto world!");

    let instruction = MovieInstruction::unpack(instruction_data)?;
    
    match instruction {
        MovieInstruction::AddMovieReview { title, rating, description } => {
            add_movie_review(program_id, accounts, title, rating, description)
        }
    }
}

pub fn add_movie_review(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    title: String,
    rating: u8,
    description: String
) -> ProgramResult {
    msg!("Adding movie review...");
    msg!("Title: {}", title);
    msg!("Rating: {}", rating);
    msg!("Description: {}", description);

    // error handling rating
    if rating > 5 || rating < 1 {
        msg!("Rating cannot be greater than 5 or less than 1");
        return Err(ReviewError::InvalidRating.into())
    }

    // error handling content length
    let total_length: usize = 1 + 1 + (4 + title.len()) + (4 + description.len());
    if total_length > 1000 {
        msg!("Content review exceeds maximum allocated bytes");
        return Err(ReviewError::InvalidDataLength.into())
    }

    // iterate over the accounts and assign to individual variables
    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let pda_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    // check if initializer is correct signer
    if !initializer.is_signer {
        msg!("Missing transaction signature");
        return Err(ProgramError::MissingRequiredSignature)
    }

    // derive pda and bump_seed
    let (pda, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref(), title.as_bytes().as_ref()], program_id);

    // check if pda_account passed by user is expected pda
    if pda != *pda_account.key {
        msg!("Invalid seeds for Program Derived Account");
        return Err(ReviewError::InvalidPDA.into())
    }

    // calculate account_len needed for rent - 1 each for is_initilized and rating, 4 + length of string each for title and description
    // set to 1000 to remove need to reallocate when user updates movie
    let account_len: usize = 1000;
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    // create account using invoke_signed from cross program invocation which needs pda and movie review program to sign
    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            pda_account.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[initializer.clone(), pda_account.clone(), system_program.clone()],
        &[&[initializer.key.as_ref(), title.as_bytes().as_ref(), &[bump_seed]]],
    )?;

    msg!("PDA created: {}", pda);

    msg!("unpacking state account");
    let mut account_data = try_from_slice_unchecked::<MovieAccountState>(&pda_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    // check if account_data already exists
    if account_data.is_initialized {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized)
    }

    account_data.title = title;
    account_data.rating = rating;
    account_data.description = description;
    account_data.is_initialized = true;

    msg!("serializing account");
    account_data.serialize(&mut &mut pda_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}