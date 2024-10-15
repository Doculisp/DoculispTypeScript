import { DocumentMap } from "./types.document";
import { ILocation, IProjectLocation, Result } from "./types.general";

export type TextToken = {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'token - text';
};

export type CloseParenthesisToken = {
    readonly location: ILocation;
    readonly type: 'token - close parenthesis';
};

export type AtomToken = {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'token - atom';
};

export type ParameterToken = {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'token - parameter';
};

export type Token = TextToken | CloseParenthesisToken | AtomToken | ParameterToken;

export type TokenizedDocument = {
    readonly tokens: Token[];
    readonly projectLocation: IProjectLocation;
};

export type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>;