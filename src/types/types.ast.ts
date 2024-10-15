import { ILocation, Result } from "./types.general";
import { TokenizedDocument } from "./types.tokens";

export interface IAstAtom {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-atom';
};

export interface IAstParameter {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-Parameter'
}

export interface IAstCommand {
    readonly value: string;
    readonly location: ILocation;
    readonly parameter: IAstParameter;
    readonly type: 'ast-Command'
};

export interface IAstContainer {
    readonly value: string;
    readonly location: ILocation;
    readonly subStructure: AtomAst[]
    readonly type: 'ast-container'
};

export interface IAstValue {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-value';
};

export interface IAstEmpty {
    readonly type: 'ast-Empty';
}

export type AtomAst = IAstCommand | IAstContainer | IAstAtom;
export type RootAst = IAstValue | AtomAst;
export type Ast = RootAst | IAstParameter;

export interface IAstParser {
    parse(tokens: Result<TokenizedDocument>): Result<RootAst[] | IAstEmpty>;
}