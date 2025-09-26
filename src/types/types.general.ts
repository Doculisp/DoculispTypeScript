import { IPath } from "./types.filePath";

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
    readonly documentPath: IPath;
    readonly documentDepth: number;
    readonly documentIndex: number;
}

export interface ILocationCoordinates extends IProjectLocation {
    readonly line: number;
    readonly char: number;
}

export interface ILocation extends IProjectLocation, ILocationCoordinates, IComparable<ILocation> {
    increaseLine(by?: number|undefined): ILocation;
    increaseChar(by?: number|undefined): ILocation;
};

export interface ISuccess<T> {
    readonly value: T;
    readonly success: true;
};

export interface IFailCode {
    readonly message: string;
    readonly documentPath: IPath;
    readonly line: number;
    readonly char: number;
    readonly success: false;
    readonly type: "code-fail";
};

export interface IFailGeneral {
    readonly message: string;
    readonly success: false;
    readonly documentPath?: IPath | undefined;
    readonly type: "general-fail";
}

export type IFail = IFailCode | IFailGeneral;

export type ResultCode<T> = ISuccess<T> | IFailCode;
export type ResultGeneral<T> = ISuccess<T> | IFailGeneral;

export type Result<T> = ResultCode<T> | ResultGeneral<T>;

export type LocationBuilder = (line: number, char: number) => ILocation;

export type UtilBuilder = () => IUtil;

export interface IUtil {
    ok<T>(successfulValue: T): ISuccess<T>;
    codeFailure(message: string, location: { documentPath: IPath, line: number, char: number }): IFailCode;
    generalFailure(message: string, path?: IPath): IFailGeneral;
    location: (documentPath: IPath, documentDepth: number, documentIndex: number, line: number, char: number) => ILocation;
    toLocation: (projectLocation: IProjectLocation, line: number, char: number) => ILocation;
    getProjectLocation: (location: ILocationCoordinates) => IProjectLocation;
}