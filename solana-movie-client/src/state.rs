use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct MovieAccountState {
    pub is_initilized: bool,
    pub rating: u8,
    pub title: String,
    pub description: String
}