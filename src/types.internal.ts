import { ILocation, Result } from "./types.general";

export interface IParseStepForward {
    rest: string;
    line: number;
    char: number;
};

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

export interface IUnparsed {
    remaining: string;
    location: ILocation;
    type: 'unparsed'
}

export type StepParse<T> = IParseStepForward & (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult);

export type CreateParser<T> = (...handlers: HandleValue<T>[]) => IParser<T>;

export interface IInternals {
    buildStepParse<T>(step: IParseStepForward, resultType: (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult)): StepParse<T>;
    createParser<T>(...handlers: HandleValue<T>[]): IParser<T>;
}

export type StepParseResult<T> = Result<StepParse<T> | false | 'stop'>;

export type HandleValue<T> = (input: string, line: number, char: number) => StepParseResult<T>;

export interface IParser<T> {
    parse(input: string, line: number, char: number): Result<[T[], IUnparsed]>;
}