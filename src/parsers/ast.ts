import { IAstParser, ISectionWriter } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { Result } from "../types.general";
import { IInternals } from "../types.internal";
import { Token } from "../types.tokens";

function buildAstParser(internals: IInternals): IAstParser {
    return {
        parse(maybeTokens: Result<Token[]>): Result<ISectionWriter> {
            if(maybeTokens.success){
                throw new Error('not implemented')
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