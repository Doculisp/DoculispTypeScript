import { IRegisterable } from "../types/types.containers";
import { IPath, PathConstructor } from "../types/types.filePath";

class PathHandler implements IPath {
    private readonly _fullName: string;
    private readonly _extension: string | false;
    private readonly _dirName: string;
    private readonly _path: any;

    constructor(pathString: string, path: any) {
        this._fullName = path.resolve(pathString);
        const ex = path.extname(pathString);
        if(ex.length === 0) {
            this._extension = false;
        }
        else {
            this._extension = ex;
        }
        
        this._dirName = path.dirname(this._fullName);
        this._path = path;
    }
    
    getRelativeFrom(rootPath: IPath): string {
        return this._path.relative(rootPath.fullName, this._fullName);
    }

    get extension(): string | false {
        return this._extension;
    }
    
    readonly type: "path" = "path";

    get fullName(): string {
        return this._fullName;
    }

    getContainingDir(): IPath {
        return new PathHandler(this._dirName, this._path);
    }

    toString(): string {
        return this._fullName;
    }

    toJSON(): any {
        return this._fullName;
    }
}

function buildLoader(path: any): PathConstructor {
    return function(pathString: string): IPath {
        return new PathHandler(pathString, path)
    }
}

const pathLoader: IRegisterable = {
    builder: (path: any) => buildLoader(path),
    name: 'pathConstructor',
    dependencies: ['path'],
    singleton: true,
};

export {
    pathLoader,
};
