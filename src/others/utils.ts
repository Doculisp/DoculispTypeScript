import { IRegisterable } from "../types/types.containers";
import { IFail, ILocation, IProjectLocation, ISuccess, IUtil, IsAfter, IsBefore, IsOrder, IsSame, isAfter, isBefore, isSame } from "../types/types.general";

function before() : IsBefore { return isBefore; }
function after()  : IsAfter  { return isAfter; }
function same()   : IsSame   { return isSame; }

class Location implements ILocation {
    private readonly _documentPath: string;
    private readonly _documentDepth: number;
    private readonly _documentIndex: number;
    private readonly _line: number;
    private readonly _char: number;
    
    constructor(documentPath: string, documentDepth: number, documentIndex: number, line: number, char: number) {
        this._documentPath = documentPath;
        this._documentDepth = documentDepth;
        this._documentIndex = documentIndex;
        this._line = line;
        this._char = char;
    }

    public get documentPath(): string {
        return this._documentPath;
    }

    public get documentDepth(): number {
        return this._documentDepth;
    }

    public get documentIndex() : number {
        return this._documentIndex;
    }

    public get line(): number {
        return this._line;
    }

    public get char(): number {
        return this._char;
    }

    orderId(): number {
        return (
            this._documentDepth * 1000
            + this._documentIndex * 100
            + this._line * 10
            + this._char
        );
    }

    increaseLine(by?: number | undefined): ILocation {
        let add = by ?? 1;
        return new Location(this._documentPath, this._documentDepth, this._documentIndex, this._line + add, 1);
    }

    increaseChar(by?: number | undefined): ILocation {
        let add = by ?? 1;
        return new Location(this._documentPath, this._documentDepth, this._documentIndex, this._line, this._char + add);
    }

    compare(other: ILocation): IsOrder {
        if(other.documentDepth < this._documentDepth) {
            return before();
        }
        if(this._documentDepth < other.documentDepth) {
            return after();
        }

        if(other.documentIndex < this._documentIndex) {
            return before();
        }
        if(this._documentIndex < other.documentIndex) {
            return after();
        }

        if(other.line < this._line) {
            return before();
        }
        if(this._line < other.line) {
            return after();
        }

        if(other.char < this._char) {
            return before();
        }
        if(this.char < other.char) {
            return after();
        }

        return same();
    }

    toString(): string {
        return JSON.stringify({ path: this._documentPath, line: this._line, char: this._char });
    }

    asJson() {
        return {
            documentPath: this._documentPath,
            documentDepth: this._documentDepth,
            documentIndex: this._documentIndex,
            line: this._line,
            char: this._char,
        };
    }
}

function ok<T>(successfulValue: T) : ISuccess<T> {
    return {
        value: successfulValue,
        success: true,
    };
};

function fail(message: string, documentPath: string) : IFail {
    return {
        message,
        documentPath,
        success: false,
    };
};

function location(documentPath: string, documentDepth: number, documentIndex: number, line: number, char: number): ILocation {
    return new Location(documentPath, documentDepth, documentIndex, line, char);
}

function toLocation(projectLocation: IProjectLocation, line: number, char: number): ILocation {
    return new Location(projectLocation.documentPath, projectLocation.documentDepth, projectLocation.documentIndex, line, char);
}

function getProjectLocation(location: ILocation): IProjectLocation {
    return {
        documentPath: location.documentPath,
        documentDepth: location.documentDepth,
        documentIndex: location.documentIndex,
    };
}

function buildGeneral(): IUtil {
    

    return {
        ok,
        fail,
        location,
        toLocation,
        getProjectLocation,
    };
}

const astParser: IRegisterable = {
    builder: () => buildGeneral(),
    name: 'util',
    singleton: true,
    dependencies: []
};

export {
    astParser,
};