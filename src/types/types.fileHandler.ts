import { IPath } from "./types.filePath";
import { ResultGeneral } from "./types.general";

export interface IFileLoader {
    load(path: IPath): ResultGeneral<string>;
};

export interface IFileWriter {
    write(path: IPath, text: ResultGeneral<string>): ResultGeneral<string>;
};

export interface IDirectoryHandler {
    getProcessWorkingDirectory(): ResultGeneral<IPath>;
    setProcessWorkingDirectory(directory: IPath): ResultGeneral<undefined>;
}

export interface IFileHandler extends IFileLoader, IFileWriter, IDirectoryHandler {
};