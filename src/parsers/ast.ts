import { AstPart, IAst, IAstParser } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { ILocation, IUtil, Result } from "../types.general";
import { HandleValue, IInternals, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function isSectionMeta(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
    return function(toParse: Token[], starting: ILocation):  StepParseResult<Token[], AstPart> {
        let sectionFound = false;
        let depth = 0;
        let start: ILocation | undefined;

        function tryParseSectionMeta(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(input.length < 2) {
                return util.ok(false);
            }

            const open = input[0] as Token;
            const atom = input[1] as Token;

            if(open.type !== 'token - open parenthesis') {
                return util.ok(false);
            }

            if(atom.type !== 'token - atom' || atom.text !== 'section-meta') {
                return util.ok(false);
            }

            //Possible error: (section-meta (section-meta (title something)))
            sectionFound = true;
            depth++;
            start = open.location;
            input.shift();
            input.shift();

            return util.ok({
                type: 'discard',
                location: current.increaseChar(),
                rest: input,
            });
        }

        function tryParseTitle(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(!sectionFound && input.length < 4) {
                return util.ok(false);
            }

            const open = input[0] as Token;
            const atom = input[1] as Token;
            const param = input[2] as Token;
            const close = input[3] as Token;

            if(open.type !== 'token - open parenthesis') {
                return util.ok(false);
            }

            if(atom.type !== 'token - atom' || atom.text !== 'title') {
                return util.ok(false);
            }

            if(param.type !== 'token - parameter') {
                // possible error
                return util.ok(false);
            }

            if(close.type !== 'token - close parenthesis') {
                // possible error
                return util.ok(false);
            }

            input.shift();
            input.shift();
            input.shift();
            input.shift();

            const link = '#' + param.text.toLocaleLowerCase().replaceAll(' ', '_') ; //need to take link parameter.
            const label = ' '.padStart(open.location.documentDepth + 1, '#') + param.text;

            const part: AstPart = {
                type: 'ast-title',
                title: param.text,
                label,
                link,
                documentOrder: open.location,
            };

            return util.ok({
                type: 'parse result',
                subResult: part,
                rest: input,
                location: current.increaseChar(),
            });
        }

        function tryParseClose(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(!sectionFound || depth < 1) {
                return util.ok(false);
            }

            if(input.length < 1) {
                return util.ok(false);
            }

            const close = input[0] as Token;

            if(close.type !== 'token - close parenthesis') {
                return util.ok(false);
            }

            depth--;
            input.shift();

            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseChar(),
            });
        }

        const parser = internals.createArrayParser(tryParseSectionMeta, tryParseTitle, tryParseClose);
        const parsed = parser.parse(toParse, starting);

        if(!parsed.success) {
            return parsed;
        }

        const [result, leftovers] = parsed.value;

        if(start && 0 === result.length) {
            return util.fail(`section-meta atom at ${start.toString()} must contain at least a title.`, starting.documentPath);
        }

        if(0 === result.length) {
            return util.ok(false);
        }

        return util.ok({
            type: 'parse group result',
            subResult: result.map(r => { return { type: 'keep', keptValue: r }; }),
            rest: leftovers.remaining,
            location: leftovers.location,
        });
    };
}

function isHeader(util: IUtil): HandleValue<Token[], AstPart> {
    return function (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
        if(input.length < 3) {
            return util.ok(false);
        }

        let open = input[0] as Token;
        let atom = input[1] as Token;
        let param = input[2] as Token;

        if(open.type !== 'token - open parenthesis') {
            return util.ok(false);
        }

        if(atom.type !== 'token - atom' || !atom.text.startsWith('#')) {
            return util.ok(false);
        }

        if(param.type !== 'token - parameter') {
            return util.fail(`Header at ${open.location.toString()} has no header text.`, open.location.documentPath);
        }

        let close = input[3] as Token;
        if(close.type !== 'token - close parenthesis') {
            return util.fail(`Header at ${open.location.toString()} has unexpected character at ${close.location.toString()}`, close.location.documentPath);
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
            depthCount: atom.text.length + open.location.documentDepth,
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
                const parser = internals.createArrayParser(isText(util), isHeader(util), isSectionMeta(internals, util));
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