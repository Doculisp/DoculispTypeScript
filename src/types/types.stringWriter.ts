import { IDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp>): Result<string>;
};