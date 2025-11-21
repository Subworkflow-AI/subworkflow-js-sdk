import * as path from 'node:path';
import type { ApiClient, ApiResponse } from "../client";
import type { DatasetsAPI } from "../datasets";
import type { JobsAPI } from '../jobs/api';
import type { ExtractRequestOpts, UploadSessionOpts, VectorizeRequestOpts } from "./api.types";
import { MultipartUploader } from './multipartUploader';
import type { Job } from '../types';


type FileLike = Blob | File | { arrayBuffer: () => Promise<ArrayBuffer>; type?: string; };

interface NormalizedFile {
    blob: Blob;
    size: number;
    type: string;
}

async function normalizeFile(input: FileLike): Promise<NormalizedFile> {
    if (input instanceof Blob) {
        return { blob: input, size: input.size, type: input.type };
    }

    if (input instanceof File) {
        return { blob: input, size: input.size, type: input.type };
    }

    if (typeof (input as any).arrayBuffer === 'function') {
        const bunFile = input as { arrayBuffer: () => Promise<ArrayBuffer>; type?: string; };
        const arrayBuffer = await bunFile.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: bunFile.type || 'application/octet-stream' });
        return { blob, size: blob.size, type: blob.type };
    }

    throw new Error('Unsupported file input type');
}

export class UploadAPI {
    constructor(
        private readonly api: ApiClient,
        private readonly datasets: DatasetsAPI,
        private readonly jobs: JobsAPI
    ) {
    }

    isMultipartUploadThreshold(fileSize: number) {
        return fileSize > 1024 * 1024 * 100;
    }

    async uploadSession(file: Blob, opts: UploadSessionOpts) {
        const _fileExt = path.extname(opts.fileName);
        const fileExt = _fileExt.replace('.', '');
        const fileName = path.basename(opts.fileName).replace(_fileExt,'');

        const uploader = new MultipartUploader<Job>(this.api, {
            chunkSize: opts.chunkSize,
            concurrency: opts.concurrency
        });
        await uploader.start({
            fileName: fileName,
            fileExt: fileExt,
            fileType: file.type,
            jobType: opts.jobType,
            expiryInDays: opts.expiryInDays,
        });
        await uploader.append(file);
        const res = await uploader.end();
        if (res.error) throw new Error(res.error);
        const job = res.data;
        return job;
    }

    async extract(fileInput: FileLike, opts: ExtractRequestOpts) {
        let job: Job | undefined;
        const { blob: file, size: fileSize } = await normalizeFile(fileInput);

        const isMultipartUpload = this.isMultipartUploadThreshold(fileSize);
        if (isMultipartUpload) {
            job = await this.uploadSession(file, {
                jobType: 'extract',
                fileName: opts.fileName,
                chunkSize: opts.chunkSize ?? 1024 * 1024 * 10,
                concurrency: opts.concurrency ?? 4,
                expiryInDays: opts.expiryInDays ?? 90
            });
        } else {
            const formData = new FormData();
            if (opts.expiryInDays !== undefined) formData.append('expiryInDays', String(opts.expiryInDays));
            formData.append('file', file, opts.fileName);

            const req = await this.api.$post(`/extract`,{ form: formData });

            const res = await req.json() as ApiResponse<Job>;
            if (res.error) throw new Error(JSON.stringify(res.error));
            job = res.data;
        }

        if (!job?.id) throw new Error('Expected job but got none');
        if (opts.async) return job;

        let maxPollingCount = Math.round(fileSize/1024/1024) * 45;
        const jobResponse = await this.jobs.poll(job, maxPollingCount < 15 ? 15 : maxPollingCount);

        if (!jobResponse?.datasetId) throw new Error(`Expected dataset after job polling but got none. ${jobResponse}`);
        const dataset = await this.datasets.get(jobResponse.datasetId);
        return dataset;
    }

    async vectorize(fileInput: FileLike, opts: VectorizeRequestOpts) {
        let job: Job | undefined;
        const { blob: file, size: fileSize } = await normalizeFile(fileInput);

        const isMultipartUpload = this.isMultipartUploadThreshold(fileSize);
        if (isMultipartUpload) {
            job = await this.uploadSession(file, {
                jobType: 'vectorize',
                fileName: opts.fileName,
                chunkSize: opts.chunkSize ?? 1024 * 1024 * 10,
                concurrency: opts.concurrency ?? 4,
                expiryInDays: opts.expiryInDays ?? 90
            });
        } else {
            const formData = new FormData();
            if (opts.expiryInDays !== undefined) formData.append('expiryInDays', String(opts.expiryInDays));
            formData.append('file', file, opts.fileName);

            const req = await this.api.$post(`/vectorize`,{ form: formData });
            const res = await req.json() as ApiResponse<Job>;
            if (res.error) throw new Error(res.error);
            job = res.data;
        }

        if (!job?.id) throw new Error('Expected job but got none');
        if (opts.async) return job;

        let maxPollingCount = Math.round(fileSize/1024/1024) * 45;
        const jobResponse = await this.jobs.poll(job, maxPollingCount < 1 ? 15 : maxPollingCount);

        if (!jobResponse?.datasetId) throw new Error(`Expected dataset after job polling but got none. ${jobResponse}`);
        const dataset = await this.datasets.get(jobResponse.datasetId);
        return dataset;
    }
}
