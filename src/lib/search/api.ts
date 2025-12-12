import type { ApiClient, ApiResponse } from "../client";
import type { DatasetItem } from "../types";
import type { SearchOpts } from "./api.types";

export class SearchAPI {
    constructor(
        private readonly api: ApiClient
    ){}

    search = async (opts: SearchOpts) => {
        const json = {
            ...opts,
            datasetIds: opts.datasets
                ? Array.isArray(opts.datasets)
                    ? opts.datasets.map(item => typeof item === 'string' ? item : item.id)
                    : typeof opts.datasets === 'string' ? [opts.datasets] : [opts.datasets.id]
                : undefined,
        };
        const req = await this.api.$post(`/search`,{ json });
        const res = await req.json() as ApiResponse<DatasetItem[]>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }
}