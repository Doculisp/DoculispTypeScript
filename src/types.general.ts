export interface ILocation {
    line: number;
    char: number;
    documentPath: string;
};

export interface ISuccess<T> {
    value: T;
    success: true;
};

export interface IFail {
    message: string;
    documentPath: string;
    success: false;
};

export type Result<T> = ISuccess<T> | IFail;

export function ok<T>(value: T) : Result<T> {
    return {
        value,
        success: true,
    };
};

export function fail(message: string, documentPath: string) : Result<any> {
    return {
        message,
        documentPath,
        success: false,
    };
};