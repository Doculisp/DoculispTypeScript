import { Result } from "./types.general";

export interface IFileLoader {
    load(path: string): Result<string>
}