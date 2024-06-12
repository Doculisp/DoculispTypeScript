import { AstPart, IAst, IAstParser } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { ILocation, IUtil, Result, isSame } from "../types.general";
import { HandleValue, IInternals, IParseStepForward, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function isLisp(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
    return function (toParse: Token[], starting: ILocation): StepParseResult<Token[], AstPart> {
        function tryParseHeader (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(4 < input.length) {
                return util.ok(false);
            }

            let open = input[0] as Token;
            let atom = input[1] as Token;
            let param = input[2] as Token;
            let close = input[3] as Token;

            if(open.type !== 'token - open parenthesis') {
                return util.ok(false);
            }

            // possible error: '#text'
            if(atom.type !== 'token - atom' || !atom.text.startsWith('#')) {
                return util.ok(false);
            }

            if(param.type !== 'token - parameter') {
                return util.ok(false);
            }

            if(close.type !== 'token - close parenthesis') {
                return util.ok(false);
            }

            const match: string = (atom.text.match(/#+/) as any)[0];

            if(match.length !== atom.text.length) {
                return util.fail(`Header at ${open.location.toString()} has invalid syntax.`, open.location.documentPath);
            }

            input.shift();
            input.shift();
            input.shift();
            input.shift();

            const part: AstPart = {
                type: 'ast-header',
                depthCount: atom.text.length,
                text: param.text,
                documentOrder: open.location,
            };

            return util.ok({
                type: 'parse result',
                subResult: part,
                location: current.increaseChar(),
                rest: input,
            });
        }

        const parser = internals.createArrayParser(tryParseHeader);
        const parsed = parser.parse(toParse, starting);

        if(!parsed.success) {
            return parsed;
        }

        const [result, leftovers] = parsed.value;
        if(leftovers.location.compare(starting) === isSame) {
            return util.ok(false);
        }

        const step: IParseStepForward<Token[]> = {
            rest: leftovers.remaining,
            location: leftovers.location,
        }

        if(0 === result.length) {
            return util.ok(internals.buildStepParse(step, { type: 'discard' }));
        }

        return util.ok(
            internals.buildStepParse(step, {
                type: 'parse group result',
                subResult: result.map(r => { return { type: 'keep', keptValue: r } }),
            })
        );
    }
}

function isText(util: IUtil): HandleValue<Token[], AstPart> {
    return function (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
        const token: Token = input[0] as Token;
        if(token.type === 'token - text') {
            input.shift();
            return util.ok({
                type: 'parse result',
                subResult: {
                    type: 'ast-write',
                    documentOrder: token.location,
                    value: token.text,
                },
                location: current.increaseChar(),
                rest: input
            });
        }
        return util.ok(false);
    }
}

function buildAstParser(internals: IInternals, util: IUtil): IAstParser {
    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                const document = maybeTokens.value;
                const parser = internals.createArrayParser(isText(util), isLisp(internals, util));
                const parsed = parser.parse(document.tokens, util.toLocation(document.projectLocation, 0, 0));
                
                if(parsed.success) {
                    const [result, _leftovers] = parsed.value;

                    if(0 < result.length) {
                        return util.ok({
                            projectLocation: document.projectLocation,
                            section: {
                                type: 'ast-section',
                                ast: result,
                                documentOrder: util.toLocation(document.projectLocation, 0, 0),
                            },
                        });
                    }

                    return util.ok({
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