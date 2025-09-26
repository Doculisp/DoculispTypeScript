import { ILocation, IProjectLocation, ResultCode } from "./types.general";

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
    readonly projectLocation: IProjectLocation;
};

export type DocumentParser = (text: string, projectLocation: IProjectLocation) => ResultCode<DocumentMap>;