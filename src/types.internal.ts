import { Result } from "./types.general";

export type SubParseResult<T> = {
    result: T;
    rest: string;
    line: number;
    char: number;
    type: 'parse result';
}

export type SubParseGroupResult<T> = {
    result: T[];
    rest: string;
    line: number;
    char: number;
    type: 'parse group result';

};

export type DiscardResult = { 
    line: number; 
    char: number; 
    rest: string; 
    type: 'discard'
};

export type StepParseResult<T> = Result<SubParseGroupResult<T> | SubParseResult<T> | DiscardResult | false>;

export type HandleValue<T> = (value: string, line: number, char: number) => StepParseResult<T>;

export interface IParser<T> {
    parse(value: string, line: number, char: number): Result<T[]>;
}

export type CreateParser<T> = (...handlers: HandleValue<T>[]) => IParser<T>;