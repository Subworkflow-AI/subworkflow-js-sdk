export type UploadSessionOpts = {
    fileName: string;
    jobType: 'extract' | 'vectorize';
    expiresInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
}
export type ExtractRequestOpts = {
    fileName: string;
    async?: boolean;
    expiresInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
    skipUrlCheck?: boolean;
};

export type VectorizeRequestOpts = {
    fileName: string;
    async?: boolean;
    expiresInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
    skipUrlCheck?: boolean;
};
