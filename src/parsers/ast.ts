import { AstPart, IAst, IAstParser, ITitle } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { ILocation, IUtil, Result } from "../types.general";
import { HandleValue, IInternals, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function headerize(depth: number, value: string): string {
    const id = ''.padStart(depth, '#');
    return `${id} ${value} ${id}`;
}

function isSectionMeta(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
    return function(toParse: Token[], starting: ILocation):  StepParseResult<Token[], AstPart> {
        let depth = 0;
        let start: ILocation | undefined;
        let linkText: string | false = false;
        let subTitleText: string | false = false;
        let title: ITitle | false = false;

        function tryParseSectionMeta(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(input.length < 2) {
                return internals.noResultFound();
            }

            const open = input[0] as Token;
            const atom = input[1] as Token;

            if(open.type !== 'token - open parenthesis') {
                return internals.noResultFound();
            }

            if(atom.type !== 'token - atom' || atom.text !== 'section-meta') {
                return internals.noResultFound();
            }

            //Possible error: (section-meta (section-meta (title something)))
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
            if(!start && input.length < 3) {
                return internals.noResultFound();
            }

            const open = input[0] as Token;
            const atom = input[1] as Token;
            const param = input[2] as Token;

            if(open.type !== 'token - open parenthesis') {
                return internals.noResultFound();
            }

            if(atom.type !== 'token - atom' || atom.text !== 'title') {
                return internals.noResultFound();
            }

            if(param.type !== 'token - parameter') {
                return util.fail(`Title at ${open.location.toString()} does not contain title text.`, open.location.documentPath);
            }

            const close = input[3] as Token;
            if(close.type !== 'token - close parenthesis') {
                return internals.noResultFound();
            }

            input.shift();
            input.shift();
            input.shift();
            input.shift();

            const link = (
                linkText ? 
                linkText :
                '#' + param.text.toLocaleLowerCase().replaceAll(' ', '_'));

            const label = headerize(open.location.documentDepth, param.text);
            const subtitle: string | undefined = 
                subTitleText ?
                subTitleText :
                undefined;

            title = {
                type: 'ast-title',
                title: param.text,
                subtitle,
                label,
                link,
                documentOrder: open.location,
            };

            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseChar(),
            });
        }

        function tryParseLink(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(!start) {
                return internals.noResultFound();
            }

            if(input.length < 3) {
                return internals.noResultFound();
            }

            const open = input[0] as Token;
            const link = input[1] as Token;
            const param = input[2] as Token;

            if(open.type !== 'token - open parenthesis') {
                return internals.noResultFound();
            }

            if(link.type !== 'token - atom' || link.text !== 'link') {
                return internals.noResultFound()
            }

            if(param.type !== 'token - parameter') {
                return util.fail(`the Link Command at ${open.location.toString()} does not have a link text.`, open.location.documentPath);
            }

            const close = input[3] as Token;
            if(close.type !== 'token - close parenthesis') {
                return internals.noResultFound();
            }

            linkText = '#' + param.text;

            if(title) {
                const n: ITitle = {
                    type: 'ast-title',
                    label: title.label,
                    title: title.title,
                    link: linkText,
                    documentOrder: title.documentOrder,
                }

                title = n;
            }

            input.shift();
            input.shift();
            input.shift();
            input.shift();

            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseChar(),
            });
        }

        function tryParseSubtitle(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(!start) {
                return internals.noResultFound();
            }

            if(input.length < 4) {
                return internals.noResultFound();
            }

            const open = input[0] as Token;
            const atom = input[1] as Token;
            const param = input[2] as Token;

            if(open.type !== 'token - open parenthesis') {
                return internals.noResultFound();
            }

            if(atom.type !== 'token - atom') {
                return internals.noResultFound();
            }

            if(param.type !== 'token - parameter') {
                return util.fail(`The Subtitle command at ${open.location} does not contain subtitle text.`, open.location.documentPath);
            }

            const close = input[3] as Token;
            if(close.type !== 'token - close parenthesis') {
                return internals.noResultFound();
            }

            const text = headerize(starting.documentDepth + 2, param.text);

            if(title) {
                const nt: ITitle = {
                    type: 'ast-title',
                    title: title.title,
                    subtitle: text,
                    label: title.label,
                    link: title.link,
                    documentOrder: title.documentOrder,
                };

                title = nt;
            }

            subTitleText = text;
            input.shift();
            input.shift();
            input.shift();

            return util.ok({
                type: 'discard',
                rest: input,
                location: open.location,
            });
        }

        function tryParseClose(input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            if(!start || depth < 1) {
                return internals.noResultFound();
            }

            if(input.length < 1) {
                return internals.noResultFound();
            }

            const close = input[0] as Token;

            if(close.type !== 'token - close parenthesis') {
                return internals.noResultFound();
            }

            depth--;
            input.shift();

            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseChar(),
            });
        }

        const parser = internals.createArrayParser(tryParseSectionMeta, tryParseTitle, tryParseClose, tryParseLink, tryParseSubtitle);
        const parsed = parser.parse(toParse, starting);

        if(!parsed.success) {
            return parsed;
        }

        if(!start) {
            return internals.noResultFound();
        }

        const [result, leftovers] = parsed.value;

        if(!title) {
            return util.fail(`section-meta atom at ${start.toString()} must contain at least a title.`, starting.documentPath);
        }

        result.unshift(title);

        return util.ok({
            type: 'parse group result',
            subResult: result.map(r => { return { type: 'keep', keptValue: r }; }),
            rest: leftovers.remaining,
            location: leftovers.location,
        });
    };
}

function isHeader(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
    return function (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
        if(input.length < 3) {
            return internals.noResultFound();
        }

        let open = input[0] as Token;
        let atom = input[1] as Token;
        let param = input[2] as Token;

        if(open.type !== 'token - open parenthesis') {
            return internals.noResultFound();
        }

        if(atom.type !== 'token - atom' || !atom.text.startsWith('#')) {
            return internals.noResultFound();
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

function isText(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
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
        return internals.noResultFound();
    }
}

function buildAstParser(internals: IInternals, util: IUtil): IAstParser {
    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                const document = maybeTokens.value;
                const parser = internals.createArrayParser(isText(internals, util), isHeader(internals, util), isSectionMeta(internals, util));
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
    dependencies: ['internals', 'util']
};

export {
    astParser,
};