import { IAstEmpty, RootAst } from "./types.ast";
import { IPath } from "./types.filePath"
import { ILocation, ResultCode } from "./types.general";
import { IVariableTable } from "./types.variableTable";

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
    parse(tokenResults: ResultCode<RootAst | IAstEmpty>, variableTable: IVariableTable): ResultCode<IProjectDocuments>;
};