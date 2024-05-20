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

export function asSuccess<T>(value: Result<T>): ISuccess<T> {
    if(value.success) {
        return value;
    }

    throw new Error(`Expected success but got: ${JSON.stringify(value)}`);
}

export function fail(message: string) : Result<any> {
    return {
        message,
        success: false
    };
};

export function asFailure(value: Result<any>): IFail {
    if (value.success) {
        throw new Error(`Expected failure but got: ${value}`);
    }

    return value;
}