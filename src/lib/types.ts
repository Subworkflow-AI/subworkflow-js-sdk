export type Job = {
    id: string;
    datasetId: string;
    type: string;
    status: string;
    statusText: string;
    startedAt: number;
    finishedAt: number;
    canceledAt: number;
    createdAt: number;
    updatedAt: number;
};

export type Dataset = {
    id: string;
    workspaceId: string;
    type: string;
    fileName: string;
    fileExt: string;
    fileSize: number;
    itemCount: number;
    mimeType: string;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
    share: {
        url: string;
        token: string;
        expiresAt: number;
    }
};

export type DatasetItem = {
    id: string;
    col: number;
    row: string;
    createdAt: number;
    share: {
        url: string;
        token: string;
        expiresAt: number;
    }
};