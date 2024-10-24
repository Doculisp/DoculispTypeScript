import { Result } from "./types.general";

export interface IFileLoader {
    load(path: string): Result<string>;
};

export interface IFileWriter {
    write(path: string, text: Result<string>): Result<string>;
};

export interface IDirectoryHandler {
    getProcessWorkingDirectory(): Result<string>;
    setProcessWorkingDirectory(directory: string): Result<undefined>;
}

export interface IPathHandler {
    resolvePath(filePath: string): string;
}

export interface IFileHandler extends IFileLoader, IFileWriter, IDirectoryHandler, IPathHandler {
};