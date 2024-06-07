import { IAstParser, IEmptyAst, ISectionWriter } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { Result, ok } from "../types.general";
import { IInternals } from "../types.internal";
import { Token } from "../types.tokens";

function buildAstParser(internals: IInternals): IAstParser {
    return {
        parse(maybeTokens: Result<Token[]>): Result<ISectionWriter | IEmptyAst> {
            if(maybeTokens.success){
                return ok({type: 'ast-empty'});
            }

            return maybeTokens;
        }
    };
}

const astParser: IRegisterable = {
    builder: (internals: IInternals) => buildAstParser(internals),
    name: 'astParse',
    singleton: true,
    dependencies: ['parser']
};

export {
    astParser,
};