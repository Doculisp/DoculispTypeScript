import { IAst } from "./types.ast";
import { Result } from "./types.general";

export interface IStringWriter {
    writeAst(astMaybe: Result<IAst>): Result<string>;
};