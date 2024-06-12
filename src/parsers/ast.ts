import { AstPart, IAst, IAstParser } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { ILocation, IUtil, Result } from "../types.general";
import { HandleValue, IInternals, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function isText(util: IUtil): HandleValue<Token[], AstPart> {
    const ok = util.ok;
    return function (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
        const token: Token = input.shift() as Token;
        if(token.type === 'token - text') {
            let order = token.location;
            return ok({
                type: 'parse result',
                subResult: {
                    type: 'ast-write',
                    documentOrder: order,
                    value: token.text,
                },
                location: current.increaseChar(1),
                rest: input
            });
        }
        return ok(false);
    }
}

function buildAstParser(internals: IInternals, util: IUtil): IAstParser {
    const ok = util.ok;
    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                const document = maybeTokens.value;
                const parser = internals.createArrayParser(isText(util));
                const parsed = parser.parse(document.tokens, util.toLocation(document.projectLocation, 0, 0));
                
                if(parsed.success) {
                    const [result, _leftovers] = parsed.value;

                    if(0 < result.length) {
                        return ok({
                            projectLocation: document.projectLocation,
                            section: {
                                type: 'ast-section',
                                ast: result,
                                documentOrder: util.toLocation(document.projectLocation, 0, 0),
                            },
                        });
                    }

                    return ok({
                        projectLocation: document.projectLocation,
                        section: { type: 'ast-empty' },
                    });
                }

                return parsed;
            }

            return maybeTokens;
        }
    };
}

const astParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil) => buildAstParser(internals, util),
    name: 'astParse',
    singleton: true,
    dependencies: ['parser', 'util']
};

export {
    astParser,
};