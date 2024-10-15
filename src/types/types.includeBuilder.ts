import { IDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IIncludeBuilder {
    parse(path: string): Result<IDoculisp>;
    parseExternals(doculisp: Result<IDoculisp>): Result<IDoculisp>;
}
