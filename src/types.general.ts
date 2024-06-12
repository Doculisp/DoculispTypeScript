export type IsBefore = -1
export type IsSame = 0
export type IsAfter = 1;
export type IsOrder = IsBefore | IsSame | IsAfter;

export const isBefore: IsBefore = -1;
export const isSame: IsSame = 0;
export const isAfter: IsAfter = 1;

export interface IComparable<T> {
    compare(other: T) : IsOrder
};

export interface IProjectLocation {
    readonly documentPath: string;
    readonly documentDepth: number;
    readonly documentIndex: number;
}

export interface ILocation extends IProjectLocation, IComparable<ILocation> {
    readonly line: number;
    readonly char: number;
    increaseLine(by?: number|undefined): ILocation;
    increaseChar(by?: number|undefined): ILocation;
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
    location: (documentPath: string, documentDepth: number, documentIndex: number, line: number, char: number) => ILocation;
    toLocation: (projectLocation: IProjectLocation, line: number, char: number) => ILocation;
    getProjectLocation: (location: ILocation) => IProjectLocation;
}