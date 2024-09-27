import { IAst } from "./types.ast";
import { Result } from "./types.general";

export interface IAstBuilder {
    parse(path: string): Result<IAst>;
    parseExternals(ast: Result<IAst>): Result<IAst>;
}
