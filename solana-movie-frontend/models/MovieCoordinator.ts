import * as web3 from "@solana/web3.js";
import { Movie } from "../models/Movie";
import bs58 from "bs58";

const MOVIE_REVIEW_PROGRAM_ID = "CenYq6bDRB7p73EjsPEpiYN7uveyPUTdXkDkgUduboaN";
const MOVIE_REVIEW_PROGRAM_ID__PK = new web3.PublicKey(MOVIE_REVIEW_PROGRAM_ID);

export class MovieCoordinator {
    static accountsPK: web3.PublicKey[] = [];

    static async prefetchAccounts(connection: web3.Connection, search: string) {
        const accounts = await connection.getProgramAccounts(
            MOVIE_REVIEW_PROGRAM_ID__PK,
            {
                dataSlice: { offset: 2, length: 18 },
                filters: search === "" ? [] : [
                    {
                        memcmp: {
                            offset: 6,
                            bytes: bs58.encode(Buffer.from(search))
                        }
                    }
                ]
            }
        )

        accounts.sort( (a, b) => {
            const lengthA = a.account.data.readUInt32LE(0)
            const lengthB = b.account.data.readUInt32LE(0)
            const dataA = a.account.data.slice(4, 4 + lengthA)
            const dataB = b.account.data.slice(4, 4 + lengthB)
            return dataA.compare(dataB)
          })

        this.accountsPK = accounts.map(account => account.pubkey);
    }

    static async fetchPage(connection: web3.Connection, start: number, rows: number, search: string, reload: Boolean = false): Promise<Movie[]> {
        if (this.accountsPK.length === 0 || reload) {
            await this.prefetchAccounts(connection, search);
        }

        const paginatedPublicKeys = this.accountsPK.slice(
            (start - 1) * rows,
            start * rows
        );

        if (paginatedPublicKeys.length === 0) {
            return [];
        }

        const accounts = await connection.getMultipleAccountsInfo(paginatedPublicKeys);

        const movies = [];

        for (const account of accounts) {
            if (account !== null) {
                const movie = Movie.deserialize(account.data);
                if (movie !== null) {
                    movies.push(movie);
                }
            }
        }

        return movies
    }
}

