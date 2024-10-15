import { IDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IDocWriter {
    compile(astResult: Result<IDoculisp>): Result<string>;
    write(path: string, astResult: Result<IDoculisp>): Result<string>;
}