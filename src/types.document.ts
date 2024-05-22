import { ILocation, Result } from "./types.general";

export interface IText {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'text';
};

export interface ILispBlock {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'lisp';
};

export type DocumentPart = IText | ILispBlock;

export type DocumentMap = {
    readonly parts: DocumentPart[];
    readonly documentPath: string;
};

export type DocumentParser = (text: string, path: string) => Result<DocumentMap>;