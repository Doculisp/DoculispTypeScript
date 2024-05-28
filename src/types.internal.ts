import { ILocation } from "./types.general";

export type ParseResult = {
    result: string;
    rest: string;
    line: number;
    char: number;
    start: ILocation | undefined;
}