import { Result } from "./types.general";

export type ParseResult<T> = {
    result: T;
    rest: string;
    line: number;
    char: number;
    type: 'parse result';
}

export type DiscardResult = { line: number; char: number; rest: string; type: 'discard'};

export type HandleValue<T> = (value: string, line: number, char: number) => Result<ParseResult<T> | DiscardResult | false>;

export interface IParser<T> {
    parse(value: string, line: number, char: number): Result<T[]>;
}

export type CreateParser<T> = (...handlers: HandleValue<T>[]) => IParser<T>;