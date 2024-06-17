import { IAst } from "./types.ast";
import { Result } from "./types.general";

export interface IGrandParser {
    parse(documentPath: string, text: string, depth: number, index: number): Result<IAst>;
}