import { IPath } from "./types.filePath";
import { Result } from "./types.general";

export interface IController {
    compile(sourcePath: IPath, destinationPath?: IPath | false): Result<string>[];
    test(sourcePath: IPath): Result<false>[];
}