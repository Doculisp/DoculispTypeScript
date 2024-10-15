import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";

export interface IIncludeBuilder {
    parse(path: string): Result<IDoculisp | IEmptyDoculisp>;
    parseExternals(doculisp: Result<IDoculisp | IEmptyDoculisp>): Result<IDoculisp | IEmptyDoculisp>;
}
