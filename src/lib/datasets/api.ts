import type { ApiClient, ApiResponse } from "../client";
import type { JobsAPI } from "../jobs/api";
import type { Dataset, DatasetItem, Job } from "../types";

export class DatasetsAPI {
    constructor(
        private readonly api: ApiClient,
        private readonly jobs: JobsAPI
    ){}

    async get(datasetId: string, opts?: { expiryInSeconds?: number }) {
        const req = await this.api.$get(`/datasets/${datasetId}`,{ query: opts });
        const res = await req.json() as ApiResponse<Dataset>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }

    async delete(dataset: Dataset | string) {
        const datasetId = typeof dataset === 'string' ? dataset : dataset.id;
        const req = await this.api.$delete(`/datasets/${datasetId}`);
        const res = await req.json() as ApiResponse<Dataset>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }

    async vectorize(dataset: Dataset | string, opts?: { async?: boolean }) {
        const datasetId = typeof dataset === 'string' ? dataset : dataset.id;
        const req = await this.api.$post(`/datasets/${datasetId}/vectorize`);
        const res = await req.json() as ApiResponse<Job>;
        if (res.error) throw new Error(res.error);
        if (opts?.async || !res.data) return res.data;

        const jobResponse = await this.jobs.poll(res.data, 500);
        if (!jobResponse?.datasetId) throw new Error(`Expected dataset after job polling but got none. ${jobResponse}`);
        const datasetResponse = await this.get(jobResponse.datasetId);
        return datasetResponse;
    }

    async query(
        dataset: Dataset | string,
        opts?: {
            row?: string;
            cols?: number | number[];
            sort?: string | string[];
            offset?: number;
            limit?: number;
            expiryInSeconds?: number;
        }
    ) {
        const datasetId = typeof dataset === 'string' ? dataset : dataset.id;
        const query = opts
            ? Object.keys(opts).reduce((acc,key) => {
                const value = opts[key as keyof typeof opts];
                if (!value) return acc;
                acc[key] = Array.isArray(value) ? value.join(',') : value;
                return acc;
            },{} as Record<string,string|number>)
            : undefined;
        const req = await this.api.$get(`/datasets/${datasetId}/items`,{ query });
        const res = await req.json() as ApiResponse<DatasetItem[]>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }
}