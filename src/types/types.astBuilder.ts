import { IDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IAstBuilder {
    parse(path: string): Result<IDoculisp>;
    parseExternals(ast: Result<IDoculisp>): Result<IDoculisp>;
}
