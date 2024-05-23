import { DocumentMap } from "./types.document";
import { ILocation, Result } from "./types.general";

export type TextToken = {
    readonly text: string;
    readonly location: ILocation;
    readonly type: 'token - text';
};

export type OpenParenthesisToken = {
    readonly location: ILocation;
    readonly type: 'open parenthesis';
};

export type CloseParenthesisToken = {
    readonly location: ILocation;
    readonly type: 'token - close parenthesis';
};

export type AtomToken = {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'token - atom';
};

export type ParameterToken = {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'token - parameter';
};

export type Token = TextToken | OpenParenthesisToken | CloseParenthesisToken | AtomToken | ParameterToken;

export type TokenizedDocument = {
    readonly tokens: Token[];
    readonly documentPath: string;
}

export type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>