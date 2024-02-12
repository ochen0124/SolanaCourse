import {
    Connection,
    LAMPORTS_PER_SOL, 
    PublicKey,
    clusterApiUrl
} from "@solana/web3.js";

const suppliedPublicKey = process.argv[2];

if (!suppliedPublicKey) {
    throw new Error("Please enter a public key to check the balance of SOL");
}

try {
    const publicKey = new PublicKey(suppliedPublicKey);
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const balanceInLamports = await connection.getBalance(publicKey);
    const balanceInSOL = balanceInLamports/LAMPORTS_PER_SOL;

console.log(`💰 Finished! The balance for the wallet at address ${publicKey} is ${balanceInSOL}!`);
}
catch {
    throw new Error("Please enter a valid public key!");
}