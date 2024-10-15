import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>): Result<string>;
};