import { Result } from "./types.general";

export interface IFileHandler {
    load(path: string): Result<string>
}