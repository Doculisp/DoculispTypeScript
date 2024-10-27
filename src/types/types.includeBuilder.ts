import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { Result } from "./types.general";
import { IVariableSaver } from "./types.variableTable";

export interface IIncludeBuilder {
    parse(path: string, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
    parseExternals(doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
}
