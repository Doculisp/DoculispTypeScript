import { IAst } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IAstBuilder {
    parse(path: string): Result<IAst>;
    parseExternals(ast: Result<IAst>): Result<IAst>;
}
