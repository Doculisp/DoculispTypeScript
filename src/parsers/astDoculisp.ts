import { IAstEmpty, RootAst } from "../types/types.ast";
import { IDoculisp, IDoculispParser, IEmptyDoculisp } from "../types/types.astDoculisp";
import { IRegisterable } from "../types/types.containers";
import { IUtil, Result } from "../types/types.general";
import { IInternals } from "../types/types.internal";
import { IRootStructure } from "../types/types.structure";

function buildAstParser(internals: IInternals, util: IUtil, structure: IRootStructure): IDoculispParser {
    function parse(tokenResults: Result<RootAst[] | IAstEmpty>): Result<IDoculisp | IEmptyDoculisp> {
        return util.ok({ type: 'doculisp-empty' });
    }

    return {
        parse,
    }
}

const doculispParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil, structure: IRootStructure) => buildAstParser(internals, util, structure),
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'structure']
};

export {
    doculispParser,
};