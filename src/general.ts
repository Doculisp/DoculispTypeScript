import { IRegisterable } from "./types.containers";
import { IFail, ILocation, ISuccess, IUtil } from "./types.general";

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
        return {
            line,
            char,
        }
    }

    return {
        ok,
        fail,
        location,
    };
}

const astParser: IRegisterable = {
    builder: () => buildGeneral(),
    name: 'general',
    singleton: true,
    dependencies: []
};

export {
    astParser,
};