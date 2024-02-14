import {
    Connection,
    Transaction,
    LAMPORTS_PER_SOL,
    SystemProgram,
    sendAndConfirmTransaction,
    PublicKey,
    clusterApiUrl
} from "@solana/web3.js";
import { 
    getKeypairFromEnvironment,
    requestAndConfirmAirdropIfRequired 
} from "@solana-developers/helpers";
import "dotenv/config";

const suppliedPublicKey = process.argv[2];

if (!suppliedPublicKey) {
    throw new Error("Please enter a public key you would like to send SOL to!");
}

async function transfer(
    connection: Connection,
    sender,
    receiver,
    amount
    ) {
        const transaction = new Transaction();

        const sendSolInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: receiver,
            lamports: LAMPORTS_PER_SOL * amount
          })
          
        transaction.add(sendSolInstruction)

        const signature = await sendAndConfirmTransaction(
            connection, 
            transaction,
            [sender]
        );
}

try {
    const receiver = new PublicKey(suppliedPublicKey);

    const sender = getKeypairFromEnvironment("SECRET_KEY");
    console.log(` ✅ Loaded payer keypair ${sender.publicKey.toBase58()}`);

    const connection = new Connection(clusterApiUrl("devnet"));

    await requestAndConfirmAirdropIfRequired(
        connection,
        sender.publicKey,
        1 * LAMPORTS_PER_SOL,
        0.5 * LAMPORTS_PER_SOL,
    );

    await transfer(connection, sender, receiver, 2);
} catch (err) {
    console.error(err);
}