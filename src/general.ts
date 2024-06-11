import { IRegisterable } from "./types.containers";
import { IFail, ILocation, ISuccess, IUtil } from "./types.general";

class Location implements ILocation {
    private readonly _line: number;
    private readonly _char: number;
    
    constructor(line: number, char: number) {
        this._line = line;
        this._char = char;
    }

    public get line(): number {
        return this._line;
    }

    public get char(): number {
        return this._char;
    }

    toString(): string {
        return `{ line: ${this._line}, char: ${this._char} }`;
    }

    asJson() {
        return { line: this._line, char: this._char };
    }
}

function buildGeneral(): IUtil {
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

    function location(line: number, char: number): ILocation {
        return new Location(line, char);
    }

    return {
        ok,
        fail,
        location,
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