export type ParseResult<T> = {
    result: T;
    rest: string;
    line: number;
    char: number;
}