import type { Dataset } from "../types";

export type SearchOpts = {
    query: string | { text: string, image_url?: string };
    datasets: Dataset | Dataset[] | string | string[];
    sort?: string | string[];
    offset?: number;
    limit?: number;
    expiryInSeconds?: number;
};