import { Result } from "./types.general";

export interface IController {
    compile(sourcePath: string, destinationPath: string): Result<string>;
    test(sourcePath: string): Result<false>;
}