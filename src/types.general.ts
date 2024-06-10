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

export type LocationBuilder = (line: number, char: number) => ILocation;

export interface IUtil {
    ok<T>(successfulValue: T): ISuccess<T>
    fail(message: string, documentPath: string): IFail;
    location: (line: number, char: number) => ILocation;
}