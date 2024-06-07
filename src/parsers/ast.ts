import { IAst, IAstParser } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { Result, ok } from "../types.general";
import { IInternals } from "../types.internal";
import { TokenizedDocument } from "../types.tokens";

function buildAstParser(internals: IInternals): IAstParser {
    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                return ok({
                    documentPath: maybeTokens.value.documentPath,
                    section: { type: 'ast-empty' },
                });
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