import { IAstEmpty, RootAst } from "./types.ast";
import { IPath } from "./types.filePath"
import { Result } from "./types.general";

export interface IProjectDocument {
    id?: string | undefined
    sourcePath: IPath;
    destinationPath: IPath;
    type: 'project-document';
};

export interface IProjectDocuments {
    documents: IProjectDocument[];
    type: 'project-documents';
};

export interface IProjectParser {
    parse(tokenResults: Result<RootAst | IAstEmpty>): Result<IProjectDocuments>;
};