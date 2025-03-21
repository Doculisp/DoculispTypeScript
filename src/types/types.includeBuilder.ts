import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { IProjectDocuments } from "./types.astProject";
import { IPath } from "./types.filePath";
import { Result } from "./types.general";
import { IVariableTable } from "./types.variableTable";

export interface IIncludeBuilder {
    parse(variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
    parseProject(path: IPath, variableTable: IVariableTable): Result<IProjectDocuments>;
    parseExternals(doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
}
