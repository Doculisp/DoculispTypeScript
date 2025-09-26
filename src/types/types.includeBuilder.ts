import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { IProjectDocuments } from "./types.astProject";
import { IPath } from "./types.filePath";
import { Result, ResultCode } from "./types.general";
import { IVariableTable } from "./types.variableTable";

export interface IIncludeBuilder {
    parse(variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
    parseProject(path: IPath, variableTable: IVariableTable): Result<IProjectDocuments>;
    parseExternals(doculisp: ResultCode<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
}
