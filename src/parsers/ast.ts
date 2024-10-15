import { IAstParser, IEmpty, RootAst } from "../types/types.ast";
import { IRegisterable } from "../types/types.containers";
import { IUtil, Result } from "../types/types.general";
import { TokenizedDocument } from "../types/types.tokens";

function buildAstParser(util: IUtil): IAstParser {
    function parse(_tokens: Result<TokenizedDocument>): Result<RootAst[] | IEmpty> {
        return util.ok({ type: 'ast-Empty' })
    }

    return {
        parse,
    };
}

const astParser: IRegisterable = {
    builder: (util: IUtil) => buildAstParser(util),
    name: 'astParser',
    singleton: false,
    dependencies: ['util']
};

export {
    astParser,
};