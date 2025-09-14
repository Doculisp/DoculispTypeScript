import { IPath } from "./types.filePath";
import { Result } from "./types.general";
import { IVariableTable } from "./types.variableTable";

export interface IController {
    compile(sourcePath: IPath, destinationPath?: IPath | false): Result<string>[];
    test(variableTable: IVariableTable): Result<string | false>[];
}