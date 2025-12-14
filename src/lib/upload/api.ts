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

    isMultipartUploadThreshold = (fileSize: number) => {
        return fileSize > 1024 * 1024 * 100;
    }

    uploadSession = async (file: Blob, opts: UploadSessionOpts) => {
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

    _sync = async (
        jobType: 'extract' | 'vectorize',
        input: FileLike | URL,
        opts: ExtractRequestOpts | VectorizeRequestOpts
    ) => {
        let job: Job | undefined;
        let fileLike: NormalizedFile | undefined;
        let fileSize: number | undefined
        const isFileUpload = !(input instanceof URL);

        if (isFileUpload) {
            fileLike = await normalizeFile(input);
            fileSize = fileLike.size;

            const isMultipartUpload = this.isMultipartUploadThreshold(fileSize);
            if (isMultipartUpload) {
                job = await this.uploadSession(fileLike.blob, {
                    jobType: jobType,
                    fileName: opts.fileName,
                    chunkSize: opts.chunkSize ?? 1024 * 1024 * 10,
                    concurrency: opts.concurrency ?? 4,
                    expiryInDays: opts.expiryInDays ?? 90
                });
            } else {
                const formData = new FormData();
                if (opts.expiryInDays !== undefined) formData.append('expiryInDays', String(opts.expiryInDays));
                formData.append('file', fileLike.blob, opts.fileName);
                const req = await this.api.$post(`/${jobType}`,{ form: formData });
                const res = await req.json() as ApiResponse<Job>;
                if (res.error) throw new Error(JSON.stringify(res.error));
                job = res.data;
            }
        } else {
            let contentLength = null;
            if (!opts.skipUrlCheck) {
                const head = await fetch(input,{ method: 'head' });
                if (!head.ok) throw new Error('Unable to fetch input url metadata. Is the file accessible?');
                contentLength = head.headers.get('content-length');
            }
            fileSize = contentLength && !Number.isNaN(Number(contentLength)) ? Number(contentLength) : undefined;

            const formData = new FormData();
            if (opts.expiryInDays !== undefined) formData.append('expiryInDays', String(opts.expiryInDays));
            formData.append('url', input.toString());
            const req = await this.api.$post(`/${jobType}`,{ form: formData });
            const res = await req.json() as ApiResponse<Job>;
            if (res.error) throw new Error(JSON.stringify(res.error));
            job = res.data;
        }

        if (!job?.id) throw new Error('Expected job but got none');
        if (opts.async) return job;

        let maxPollingCount = fileSize ? Math.round(fileSize/1024/1024) * 45 : 500;
        const jobResponse = await this.jobs.poll(job, maxPollingCount < 15 ? 15 : maxPollingCount);

        if (!jobResponse?.datasetId) throw new Error(`Expected dataset after job polling but got none. ${jobResponse}`);
        const dataset = await this.datasets.get(jobResponse.datasetId);
        return dataset;
    }

    extract = async (input: FileLike | URL, opts: ExtractRequestOpts) => {
        return this._sync('extract',input,opts);
    }

    vectorize = async (fileInput: FileLike | URL, opts: VectorizeRequestOpts) => {
        return this._sync('vectorize',fileInput,opts);
    }
}
