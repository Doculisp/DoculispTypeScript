import { ILocation, Result } from "./types.general";

export interface IParseStepForward {
    rest: string;
    line: number;
    char: number;
};

export interface ISubParseResult<T> {
    result: T;
    type: 'parse result';
}

export interface ISubParseGroupResult<T> {
    result: (IKeeper<T> | IDiscardResult)[];
    type: 'parse group result';

};

export interface IKeeper<T> {
    type: 'keep';
    value: T;
};

export interface IDiscardResult { 
    type: 'discard';
};

export interface IUnparsed {
    remaining: string;
    location: ILocation;
    type: 'unparsed'
}

export type StepParseResult<T> = Result<(IParseStepForward & (ISubParseGroupResult<T> | ISubParseResult<T> | IDiscardResult)) | false | 'stop'>;

export type HandleValue<T> = (value: string, line: number, char: number) => StepParseResult<T>;

export interface IParser<T> {
    parse(value: string, line: number, char: number): Result<[T[], IUnparsed]>;
}

export type CreateParser<T> = (...handlers: HandleValue<T>[]) => IParser<T>;