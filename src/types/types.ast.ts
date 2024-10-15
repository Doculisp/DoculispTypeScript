import { ILocation, Result } from "./types.general";
import { TokenizedDocument } from "./types.tokens";

export interface IAtom {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-atom';
};

export interface IParameter {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-Parameter'
}

export interface ICommand {
    readonly value: string;
    readonly location: ILocation;
    readonly parameter: IParameter;
    readonly type: 'ast-Command'
};

export interface IAstContainer {
    readonly value: string;
    readonly location: ILocation;
    readonly subStructure: AtomAst[]
    readonly type: 'ast-container'
};

export interface IValue {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-value';
};

export interface IEmpty {
    readonly type: 'ast-Empty';
}

export type AtomAst = ICommand | IAstContainer | IAtom;
export type RootAst = IValue | AtomAst;
export type Ast = RootAst | IParameter;

export interface IAstParser {
    parse(tokens: Result<TokenizedDocument>): Result<RootAst[] | IEmpty>;
}