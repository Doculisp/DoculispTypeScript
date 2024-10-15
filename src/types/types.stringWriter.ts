import { IAst } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IStringWriter {
    writeAst(astMaybe: Result<IAst>): Result<string>;
};