import { ILocation, Result } from "./types.general";

export interface IStringParseStepForward {
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

export type StepParse<T> = IStringParseStepForward & (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult);

export type CreateStringParser<T> = (...handlers: HandleStringValue<T>[]) => IStringParser<T>;

export interface IInternals {
    buildStepParse<T>(step: IStringParseStepForward, resultType: (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult)): StepParse<T>;
    createStringParser<T>(...handlers: HandleStringValue<T>[]): IStringParser<T>;
}

export type StepParseResult<T> = Result<StepParse<T> | false | 'stop'>;

export type HandleStringValue<T> = (input: string, line: number, char: number) => StepParseResult<T>;

export interface IStringParser<T> {
    parse(input: string, line: number, char: number): Result<[T[], IUnparsed]>;
}