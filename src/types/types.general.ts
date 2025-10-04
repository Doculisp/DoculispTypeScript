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

export interface ICoordinates {
    readonly line: number;
    readonly char: number;
}

export interface ILocationCoordinates extends IProjectLocation, ICoordinates {}

export interface ILocation extends IProjectLocation, ILocationCoordinates, IComparable<ILocation> {
    increaseLine(by?: number|undefined): ILocation;
    increaseChar(by?: number|undefined): ILocation;
};

export interface ISuccess<T> {
    readonly value: T;
    readonly success: true;
};

// /**
//  * Error categories for Doculisp parsing and validation errors.
//  * These categories help classify and handle different types of errors uniformly.
//  */
// export enum ErrorCategory {
//     /** Missing required elements (close parenthesis, parameters, blocks, etc.) */
//     MISSING_ELEMENT = 'missing-element',
    
//     /** Invalid or unknown blocks, parameters, or commands */
//     UNKNOWN_ELEMENT = 'unknown-element',
    
//     /** Duplicate items where only one is allowed */
//     DUPLICATE_ELEMENT = 'duplicate-element',
    
//     /** Case sensitivity violations (uppercase where lowercase required) */
//     CASE_SENSITIVITY = 'case-sensitivity',
    
//     /** Invalid characters in IDs, names, or other identifiers */
//     INVALID_CHARACTER = 'invalid-character',
    
//     /** Structural issues (unclosed blocks, extra content, malformed syntax) */
//     STRUCTURAL_ERROR = 'structural-error',
    
//     /** File type or format validation errors */
//     FILE_TYPE_ERROR = 'file-type-error',
    
//     /** Document configuration errors (invalid depth, index, etc.) */
//     DOCUMENT_CONFIG = 'document-config',
    
//     /** Ordering or positioning constraints violations */
//     ORDERING_CONSTRAINT = 'ordering-constraint',
    
//     /** External dependency or reference errors */
//     DEPENDENCY_ERROR = 'dependency-error'
// }

// /**
//  * Maps common error message patterns to their categories.
//  * This can be used for automatic error categorization.
//  */
// export const ErrorPatterns = {
//     [ErrorCategory.MISSING_ELEMENT]: [
//         'Missing',
//         'does not contain',
//         'is missing',
//         'required'
//     ],
//     [ErrorCategory.UNKNOWN_ELEMENT]: [
//         'Unknown',
//         'invalid',
//         'unrecognized'
//     ],
//     [ErrorCategory.DUPLICATE_ELEMENT]: [
//         'Duplicate',
//         'more than one',
//         'second',
//         'multiple'
//     ],
//     [ErrorCategory.CASE_SENSITIVITY]: [
//         'must be lowercase',
//         'Did you mean'
//     ],
//     [ErrorCategory.INVALID_CHARACTER]: [
//         'Invalid character',
//         'Symbol(s)',
//         'contains'
//     ],
//     [ErrorCategory.STRUCTURAL_ERROR]: [
//         'not closed',
//         'does not close',
//         'parenthesis',
//         'malformed',
//         'extra content'
//     ],
//     [ErrorCategory.FILE_TYPE_ERROR]: [
//         'file type',
//         'Only markdown or dlisp'
//     ],
//     [ErrorCategory.DOCUMENT_CONFIG]: [
//         'document index',
//         'document depth',
//         'must be 1 or larger'
//     ],
//     [ErrorCategory.ORDERING_CONSTRAINT]: [
//         'before',
//         'after',
//         'cannot appear'
//     ],
//     [ErrorCategory.DEPENDENCY_ERROR]: [
//         'Unknown id',
//         'circular',
//         'external files'
//     ]
// } as const;

export interface IFailCode {
    readonly message: string;
    readonly documentPath: IPath;
    readonly start: ICoordinates;
    readonly end: ICoordinates;
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

export type ObsoleteWarning = {
    readonly message: string;
    readonly documentPath: IPath;
    readonly line: number;
    readonly char: number;
    type: "obsolete-warning";
}

export type Warning = {
    readonly warningInfo: ObsoleteWarning;
    readonly type: "warning";
}

export interface IUtil {
    ok<T>(successfulValue: T): ISuccess<T>;
    codeFailure(message: string, location: { documentPath: IPath, start: ICoordinates, end: ICoordinates }): IFailCode;
    generalFailure(message: string, path?: IPath): IFailGeneral;
    location: (documentPath: IPath, documentDepth: number, documentIndex: number, line: number, char: number) => ILocation;
    toLocation: (projectLocation: IProjectLocation, line: number, char: number) => ILocation;
    getProjectLocation: (location: ILocationCoordinates) => IProjectLocation;
}