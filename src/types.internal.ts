import { ILocation, Result } from "./types.general";

export interface IParseStepForward<TParse> {
    rest: TParse,
    line: number,
    char: number,
}

export interface IStringParseStepForward extends IParseStepForward<string> {};

export interface ISubParseResult<T> {
    subResult: T;
    type: 'parse result';
}

export interface ISubParseGroupResult<T> {
    subResult: (IKeeper<T> | IDiscardResult)[];
    type: 'parse group result';

};

export interface IKeeper<T> {
    type: 'keep';
    keptValue: T;
};

export interface IDiscardResult { 
    type: 'discard';
};

export interface IUnparsed<TParse> {
    remaining: TParse;
    location: ILocation;
    type: 'unparsed'
};

export interface IStringUnparsed extends IUnparsed<string> {};

export type StepParse<TParse, TResult> = IParseStepForward<TParse> & (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult);

export type StringStepParse<T> = StepParse<string, T>;

export type StepParseResult<TParse, TResult> = Result<StepParse<TParse, TResult> | false | 'stop'>;

export type StringStepParseResult<T> = StepParseResult<string, T>;

export type HandleValue<TParse, TResult> = (input: TParse, line: number, char: number) => StepParseResult<TParse, TResult>;

export type HandleStringValue<T> = (input: string, line: number, char: number) => StringStepParseResult<T>;

export interface IParser<TParse, TResult> {
    parse(input: TParse, line: number, char: number): Result<[TResult[], IUnparsed<TParse>]>;
};

export interface IStringParser<T> extends IParser<string, T> {};

export type CreateParser<TParse, TResult> = (...handlers: HandleValue<TParse, TResult>[]) => IParser<TParse, TResult>;

export type CreateStringParser<T> = CreateParser<string, T>;

export interface IInternals {
    buildStepParse<TParse, TResult>(step: IParseStepForward<TParse>, resultType: (ISubParseGroupResult<TResult> | ISubParseResult<TResult> | IDiscardResult)): StepParse<TParse, TResult>;
    createArrayParser<TParse, TResult>(...handlers: HandleValue<TParse[], TResult>[]): IParser<TParse[], TResult>;
    createStringParser<T>(...handlers: HandleStringValue<T>[]): IStringParser<T>;
}