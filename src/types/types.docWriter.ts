import { IDoculisp } from "./types.astDoculisp";
import { IPath } from "./types.filePath";
import { Result } from "./types.general";

export interface IDocWriter {
    compile(astResult: Result<IDoculisp>): Result<string>;
    write(path: IPath, astResult: Result<IDoculisp>): Result<string>;
}