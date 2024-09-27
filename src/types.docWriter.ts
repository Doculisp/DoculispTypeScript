import { IAst } from "./types.ast";
import { Result } from "./types.general";

export interface IDocWriter {
    compile(astResult: Result<IAst>): Result<string>;
    write(path: string, astResult: Result<IAst>): Result<string>;
}