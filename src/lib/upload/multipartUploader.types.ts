

export type UploadSessionStartRequest = {
    jobType: 'extract' | 'vectorize';
    fileName: string;
    fileExt: string;
    fileType: string;
    expiryInDays?: number;
};

export type UploadSessionStartResponse = {
    key: string;
};

export type UploadSessionAppendRequest = {
    key: string;
    partNumber: number;
    file: File;
};

export type UploadSessionPart = {
    etag: string;
    partNumber: number;
}

export type UploadSessionAppendResponse = UploadSessionPart;

export type UploadSessionEndRequest = {
    key: string;
    parts: Array<UploadSessionPart>
};

export type UploadSessionAbortRequest = {
    key: string;
};

export type UploadSessionAbortResponse = undefined;
