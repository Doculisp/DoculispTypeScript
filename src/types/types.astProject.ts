import { IAstEmpty, RootAst } from "./types.ast";
import { IPath } from "./types.filePath"
import { ILocation, Result } from "./types.general";

export interface IProjectDocument {
    id?: string | undefined
    sourcePath: IPath;
    destinationPath: IPath;
    location: ILocation;
    type: 'project-document';
};

export interface IProjectDocuments {
    documents: IProjectDocument[];
    location: ILocation;
    type: 'project-documents';
};

export interface IProjectParser {
    parse(tokenResults: Result<RootAst | IAstEmpty>): Result<IProjectDocuments>;
};