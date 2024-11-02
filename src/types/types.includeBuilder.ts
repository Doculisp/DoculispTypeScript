import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { IPath } from "./types.filePath";
import { Result } from "./types.general";
import { IVariableSaver } from "./types.variableTable";

export interface IIncludeBuilder {
    parse(path: IPath, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
    parseExternals(doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
}
