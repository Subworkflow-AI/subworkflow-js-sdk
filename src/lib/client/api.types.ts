export type ApiRequestInput<T> = {
    query?: T,
    json?: T,
    form?: T
};

export type ApiResponse<T> = {
    success: boolean;
    error?: string;
    data?: T;
};