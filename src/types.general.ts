export interface ILocation {
    line: number;
    char: number;
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

export function ok<T>(successfulValue: T) : Result<T> {
    return {
        value: successfulValue,
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