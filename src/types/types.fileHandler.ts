import { Result } from "./types.general";

export interface IFileLoader {
    load(path: string): Result<string>;
};

export interface IFileWriter {
    write(path: string, text: Result<string>): Result<string>;
};

export interface IDirectoryHandler {
    getProcessWorkingDirectory(): string;
    setProcessWorkingDirectory(directory: string): void;
}

export interface IFileHandler extends IFileLoader, IFileWriter, IDirectoryHandler {
};