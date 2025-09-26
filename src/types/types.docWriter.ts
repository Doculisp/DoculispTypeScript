import { IDoculisp } from "./types.astDoculisp";
import { IPath } from "./types.filePath";
import { ResultCode } from "./types.general";

export interface IDocWriter {
    compile(astResult: ResultCode<IDoculisp>): ResultCode<string>;
    write(path: IPath, astResult: ResultCode<IDoculisp>): ResultCode<string>;
}