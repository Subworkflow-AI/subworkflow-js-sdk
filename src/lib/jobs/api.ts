import type { ApiClient, ApiResponse } from "../client";
import type { DatasetItem, Job } from "../types";

export class JobsAPI {
    constructor(
        private readonly api: ApiClient
    ){}

    async poll(job: Job | string, maxPollingCount = 60 * 3) {
        const jobId = typeof job === 'string' ? job : job.id;
        if (!jobId.startsWith('dsj_')) throw new Error('Invalid job ID');

        let isFinished = false;
        let pollingCount = 0;
        let jobResponse;
        while (
            !isFinished
            && pollingCount < maxPollingCount
        ) {
            const jobRequest = await this.api.$get(`/jobs/${jobId}`);
            jobResponse = await jobRequest.json() as ApiResponse<Job>;
            if (jobResponse.error || !jobResponse.data?.status) throw new Error(`Unabled to continue polling for job. ${jobResponse}`);
            isFinished = jobResponse.data.status === 'SUCCESS' || jobResponse.data.status === 'ERROR';
            pollingCount = pollingCount + 1;
            await new Promise(res => setTimeout(res,1e3));
        }
        if (!isFinished) throw new Error(`Job polling timed out for ${jobId} (${pollingCount})`);
        return jobResponse?.data ?? null;
    }

    async get(jobId: string) {
        if (!jobId.startsWith('dsj_')) throw new Error('Invalid job ID');
        const req = await this.api.$get(`/jobs/${jobId}`);
        const res = await req.json() as ApiResponse<Job>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }

    async cancel(job: Job | string) {
        const jobId = typeof job === 'string' ? job : job.id;
        if (!jobId.startsWith('dsj_')) throw new Error('Invalid job ID');
        const req = await this.api.$delete(`/jobs/${jobId}`);
        const res = await req.json() as ApiResponse<Job>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }

    async query(opts?: {
        statuses?: string | string[];
        types?: string[],
        offset?: number;
        limit?: number;
    }) {
        const query = opts
            ? Object.keys(opts).reduce((acc,key) => {
                const value = opts[key as keyof typeof opts];
                if (!value) return acc;
                acc[key] = Array.isArray(value) ? value.join(',') : value;
                return acc;
            },{} as Record<string,string|number>)
            : undefined;
        const req = await this.api.$get(`/jobs`,{ query });
        const res = await req.json() as ApiResponse<Job[]>;
        if (res.error) throw new Error(res.error);
        return res.data || null;
    }
}