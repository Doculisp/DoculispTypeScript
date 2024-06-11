export type IsBefore = -1
export type IsSame = 0
export type IsAfter = 1;
export type IsOrder = IsBefore | IsSame | IsAfter;

export interface IComparable<T> {
    compare(other: T) : IsOrder
};

export interface ILocation extends IComparable<ILocation> {
    readonly line: number;
    readonly char: number;
};

export interface ISuccess<T> {
    readonly value: T;
    readonly success: true;
};

export interface IFail {
    readonly message: string;
    readonly documentPath: string;
    readonly success: false;
};

export type Result<T> = ISuccess<T> | IFail;

export type LocationBuilder = (line: number, char: number) => ILocation;

export interface IUtil {
    ok<T>(successfulValue: T): ISuccess<T>
    fail(message: string, documentPath: string): IFail;
    location: (line: number, char: number) => ILocation;
}