import { IPath } from "./types.filePath";
import { Result } from "./types.general";

export interface IFileLoader {
    load(path: IPath): Result<string>;
};

export interface IFileWriter {
    write(path: IPath, text: Result<string>): Result<string>;
};

export interface IDirectoryHandler {
    getProcessWorkingDirectory(): Result<IPath>;
    setProcessWorkingDirectory(directory: IPath): Result<undefined>;
}

export interface IFileHandler extends IFileLoader, IFileWriter, IDirectoryHandler {
};