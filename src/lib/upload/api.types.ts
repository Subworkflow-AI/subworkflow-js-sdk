export type UploadSessionOpts = {
    fileName: string;
    jobType: 'extract' | 'vectorize';
    expiryInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
}
export type ExtractRequestOpts = {
    fileName: string;
    async?: boolean;
    expiryInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
    skipUrlCheck?: boolean;
};

export type VectorizeRequestOpts = {
    fileName: string;
    async?: boolean;
    expiryInDays?: number;
    chunkSize?: number; 
    concurrency?: number;
    skipUrlCheck?: boolean;
};
