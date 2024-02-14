import {
    Connection,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    PublicKey,
    TransactionInstruction,
    clusterApiUrl
} from "@solana/web3.js";
import "dotenv/config"
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const PING_PROGRAM_ADDRESS = new PublicKey('ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa')
const PING_PROGRAM_DATA_ADDRESS =  new PublicKey('Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod')

async function pingProgram(
    connection: Connection, 
    payer: Keypair
    ) {
        const transaction = new Transaction();
        const programId = new PublicKey(PING_PROGRAM_ADDRESS);
        const programDataId = new PublicKey(PING_PROGRAM_DATA_ADDRESS);

        const transactionInstruction = new TransactionInstruction({
            keys: [
                {
                    pubkey: programDataId,
                    isSigner: false,
                    isWritable: true
                },
            ],
            programId
        });
    
        transaction.add(transactionInstruction);

        const signature = await sendAndConfirmTransaction(
            connection, 
            transaction,
            [payer]
        );
}

try {
    const connection = new Connection(clusterApiUrl("devnet"));
    const payer = getKeypairFromEnvironment("SECRET_KEY");
    console.log(` ✅ Loaded payer keypair ${payer.publicKey.toBase58()}`);

    await pingProgram(connection, payer);
} catch (err) {
    console.error(err);
}