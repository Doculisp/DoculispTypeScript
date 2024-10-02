import { IAst } from "./types.ast";
import { IRegisterable } from "./types.containers";
import { IUtil, Result } from "./types.general";
import { IStringWriter } from "./types.stringWriter";

function buildWriter(util: IUtil) : IStringWriter {
    function writeAst(_astMaybe: Result<IAst>): Result<string> {
        return util.ok('');
    }

    return {
        writeAst,
    }
}

const stringWriter: IRegisterable = {
    builder: (util: IUtil) => buildWriter(util),
    name: 'stringWriter',
    dependencies: ['util'],
    singleton: false,
};

export {
    stringWriter,
};