import { IAst } from "./types.ast";
import { IProjectLocation, Result } from "./types.general";

export interface IAstBuilder {
    parse(target: Result<{ text: string; projectLocation: IProjectLocation; }>): Result<IAst>;
    parseExternals(ast: Result<IAst>): Result<IAst>;
}
