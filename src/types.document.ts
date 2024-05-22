import { ILocation, Result } from "./types.general";

export interface IText {
    text: string;
    location: ILocation;
    type: 'text';
};

export interface ILispBlock {
    text: string;
    location: ILocation;
    type: 'lisp';
};

export type DocumentPart = IText | ILispBlock;

export type DocumentMap = {
    parts: DocumentPart[];
    documentPath: string;
};

export type DocumentParser = (text: string, path: string) => Result<DocumentMap>;