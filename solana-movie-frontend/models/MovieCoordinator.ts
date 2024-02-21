import * as web3 from "@solana/web3.js";
import { Movie } from "../models/Movie";

const MOVIE_REVIEW_PROGRAM_ID = "CenYq6bDRB7p73EjsPEpiYN7uveyPUTdXkDkgUduboaN";
const MOVIE_REVIEW_PROGRAM_ID__PK = new web3.PublicKey(MOVIE_REVIEW_PROGRAM_ID);

export class MovieCoordinator {
    static accountsPK: web3.PublicKey[] = [];

    static async prefetchAccounts(connection: web3.Connection) {
        const accounts = await connection.getProgramAccounts(
            MOVIE_REVIEW_PROGRAM_ID__PK,
            {
                dataSlice: { offset: 0, length: 0 }
            }
        )

        this.accountsPK = accounts.map(account => account.pubkey);
    }

    static async fetchPage(connection: web3.Connection, start: number, rows: number): Promise<Movie[]> {
        if (this.accountsPK.length === 0) {
            await this.prefetchAccounts(connection);
        }

        const paginatedPublicKeys = this.accountsPK.slice(
            (start - 1) * rows,
            start * rows
        );

        if (paginatedPublicKeys.length === 0) {
            return [];
        }

        const accounts = await connection.getMultipleAccountsInfo(paginatedPublicKeys);

        const movies = accounts.reduce((accum: Movie[], account) => {
            const movie = Movie.deserialize(account?.data);
            if (!movie) {
                return accum;
            }
            return [...accum, movie];
        }, [])

        return movies
    }
}

