export interface IPathName {
    readonly fullName: string;
}

export interface IPath extends IPathName {
    readonly extension: string | false;
    getContainingDir(): IPath;
    getRelativeFrom(rootPath: IPath): string;
    readonly type: 'path';
    toJSON(): any;
}

export type PathConstructor = (pathString: string) => IPath;