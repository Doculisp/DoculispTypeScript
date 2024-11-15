import { IDoculisp, IEmptyDoculisp } from "./types.astDoculisp";
import { IProjectDocuments } from "./types.astProject";
import { IPath } from "./types.filePath";
import { Result } from "./types.general";
import { IVariableSaver } from "./types.variableTable";

export interface IIncludeBuilder {
    parse(path: IPath, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
    parseProject(path: IPath): Result<IProjectDocuments>;
    parseExternals(doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp>;
}
