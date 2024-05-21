export interface ILocation {
    line: number;
    char: number;
    document: string;
};

export interface ISuccess<T> {
    value: T;
    success: true;
};

export interface IFail {
    message: string;
    success: false;
};

export type Result<T> = ISuccess<T> | IFail;

export function ok<T>(value: T) : Result<T> {
    return {
        value,
        success: true,
    };
};

export function fail(message: string) : Result<any> {
    return {
        message,
        success: false
    };
};