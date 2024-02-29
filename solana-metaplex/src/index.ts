import { initializeKeypair } from "./initializeKeypair"
import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
  Nft,
} from "@metaplex-foundation/js"
import * as fs from "fs"

interface NftData {
  name: string
  symbol: string
  description: string
  sellerFeeBasisPoints: number
  imageFile: string
}

interface CollectionNftData {
  name: string
  symbol: string
  description: string
  sellerFeeBasisPoints: number
  imageFile: string
  isCollection: boolean
  collectionAuthority: Keypair
}

// example data for a new NFT
const nftData = {
  name: "Name",
  symbol: "SYMBOL",
  description: "Description",
  sellerFeeBasisPoints: 0,
  imageFile: "solana.png",
}

// example data for updating an existing NFT
const updateNftData = {
  name: "Update",
  symbol: "UPDATE",
  description: "Update Description",
  sellerFeeBasisPoints: 100,
  imageFile: "success.png",
}

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));

  const user = await initializeKeypair(connection);
  console.log("PublicKey:", user.publicKey.toBase58());

  // set up metaplex
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000
      })
    );

  const collectionNftData = {
    name: "MyTestCollectionNFT",
    symbol: "TOLY",
    description: "Test Description Collection Named TOLY",
    sellerFeeBasisPoints: 100,
    imageFile: "success.png",
    isCollection: true,
    collectionAuthority: user
  };

  // upload nft collection uri
  const collectionUri = await uploadMetaData(metaplex, collectionNftData);

  // create nft collection
  const NftCollection = await createNftCollection(
    metaplex,
    collectionUri,
    collectionNftData
  );

  // upload nft and get off chain metadata uri
  const uri = await uploadMetaData(metaplex, nftData);

  // create nft 
  const nft = await createNFT(metaplex, uri, nftData, NftCollection);

  // upload updated nft and get off chain metadata uri
  const updatedUri = await uploadMetaData(metaplex, updateNftData);

  // update created nft
  await updateNftUri(metaplex, updatedUri, nft.address);
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

async function uploadMetaData(
  metaplex: Metaplex,
  nftData: NftData
): Promise<string> {
  const buffer = fs.readFileSync("src/" + nftData.imageFile);

  const file = toMetaplexFile(buffer, nftData.imageFile);

  const imageUri = await metaplex.storage().upload(file);
  console.log("image uri:", imageUri);

  const { uri } = await metaplex.nfts().uploadMetadata({
    name: nftData.name,
    symbol: nftData.symbol,
    description: nftData.description,
    image: imageUri
  });

  console.log("metadata uri:", uri);
  return uri;
}

async function createNFT(
  metaplex: Metaplex,
  uri: string,
  nftData: NftData,
  collection: NftWithToken
): Promise<NftWithToken> {
  const { nft } = await metaplex.nfts().create(
    {
      uri: uri,
      name: nftData.name,
      sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
      symbol: nftData.symbol,
      collection: collection.address
    },
    { commitment: "finalized" }
  );

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );

  await metaplex.nfts().verifyCollection({
    mintAddress: nft.mint.address,
    collectionMintAddress: collection.address,
    isSizedCollection: true
  });

  return nft;
}

async function updateNftUri(
  metaplex: Metaplex,
  uri: string,
  mintAddress: PublicKey
) {
  const nft = await metaplex.nfts().findByMint({ mintAddress });

  const { response } = await metaplex.nfts().update(
    {
      nftOrSft: nft,
      uri: uri
    },
    { commitment: "finalized"}
  );

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );

  console.log(
    `Transaction: https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}

async function createNftCollection(
  metaplex: Metaplex,
  uri: string,
  data: CollectionNftData
): Promise<NftWithToken> {
  const { nft } = await metaplex.nfts().create(
    {
      uri: uri,
      name: data.name,
      sellerFeeBasisPoints: data.sellerFeeBasisPoints,
      symbol: data.symbol,
      isCollection: true
    },
    { commitment: "finalized" }
  );

  console.log(
    `Collection Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );

  return nft
}