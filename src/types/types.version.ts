import { Result } from "./types.general";

export interface IVersion {
    getVersion() : Result<string>,
};