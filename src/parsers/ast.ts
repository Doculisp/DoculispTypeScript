import { AstBulletStyle, AstPart, IAst, IAstParser, IContentLocation, ILoad, ITableOfContents, ITitle, bulletStyles } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { ILocation, IUtil, Result } from "../types.general";
import { DiscardedResult, HandleValue, IInternals, IKeeper, IParseStepForward, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function buildAstParser(internals: IInternals, util: IUtil): IAstParser {
    let hasSection: boolean = false;
    function headerize(depth: number, value: string): string {
        const id = ''.padStart(depth, '#');
        return `${id} ${value} ${id}`;
    }

    function trimArray<T>(length: number, values: T[]): T[] {
        for (let index = 0; index < length; index++) {
            values.shift();
        }

        return values;
    }

    function isSectionMeta(internals: IInternals, util: IUtil, include: ILoad[]): HandleValue<Token[], ITitle> {
        return function(toParse: Token[], starting: ILocation):  StepParseResult<Token[], ITitle> {
            let depth = 0;
            let start: ILocation | undefined;
            let linkText: string | false = false;
            let subTitleText: string | false = false;
            let title: ITitle | false = false;

            function tryParseSectionMeta(input: Token[], current: ILocation): DiscardedResult<Token[]> {
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

                if(start && 0 < depth) {
                    return util.fail(`A nested Section-Meta command at ${open.location}.`, open.location.documentPath);
                }

                if(start) {
                    return util.fail(`A second Section-Meta command was detected at ${open.location}`, open.location.documentPath);
                }

                depth++;
                start = open.location;

                return util.ok({
                    type: 'discard',
                    location: current.increaseChar(),
                    rest: trimArray(2, input),
                });
            }

            function tryParseTitle(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 3) {
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
                    documentOrder: start,
                };

                return util.ok({
                    type: 'discard',
                    rest: trimArray(4, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseLink(input: Token[], current: ILocation): DiscardedResult<Token[]> {
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

                return util.ok({
                    type: 'discard',
                    rest: trimArray(4, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseSubtitle(input: Token[], current: ILocation): DiscardedResult<Token[]> {
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

                if(atom.type !== 'token - atom' || atom.text !== 'subtitle') {
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
                return util.ok({
                    type: 'discard',
                    rest: trimArray(4, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseClose(input: Token[], current: ILocation): DiscardedResult<Token[]> {
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

                return util.ok({
                    type: 'discard',
                    rest: trimArray(1, input),
                    location: current.increaseChar(),
                });
            }

            function trySubParseLoadable(input: Token[], current: ILocation): StepParseResult<Token[], ILoad> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(depth < 2) {
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
                    return util.fail(`Section command named "${atom.text}" at ${open.location} does not have a section title.`, open.location.documentPath);
                }

                const close = input[3] as Token;
                if(close.type !== 'token - close parenthesis') {
                    return internals.noResultFound();
                }

                const load: ILoad = {
                    type: 'ast-load',
                    sectionLabel: atom.text,
                    path: param.text,
                    documentOrder: open.location,
                    document: false,
                }

                return util.ok({
                    type: 'parse result',
                    subResult: load,
                    rest: trimArray(4, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseExternal(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 3) {
                    return internals.noResultFound();
                }

                const open = input[0] as Token;
                const atom = input[1] as Token;

                if(open.type !== 'token - open parenthesis') {
                    return internals.noResultFound();
                }

                if(atom.type !== 'token - atom' || atom.text !== 'include') {
                    return internals.noResultFound();
                }

                input = trimArray(2, input);
                depth++;

                const parser = internals.createArrayParser<Token, ILoad>(trySubParseLoadable, tryParseClose);
                const parsed = parser.parse(input, current.increaseChar());

                if(!parsed.success) {
                    return parsed;
                }

                const [rawResult, leftovers] = parsed.value;
                const result = rawResult as ILoad[];

                if(0 === result.length) {
                    return util.fail(`Include command at ${open.location} does not contain any section information.`, open.location.documentPath);
                }

                result.forEach(r => include.push(r));

                return util.ok({
                    type: 'discard',
                    rest: leftovers.remaining,
                    location: current.increaseChar(),
                });
            }

            const parser = internals.createArrayParser<Token, AstPart>(tryParseSectionMeta, tryParseTitle, tryParseClose, tryParseLink, tryParseSubtitle, tryParseExternal);
            const parsed = parser.parse(toParse, starting);

            if(!parsed.success) {
                return parsed;
            }

            if(!start) {
                return internals.noResultFound();
            }

            const [_result, leftovers] = parsed.value;

            if(!title) {
                return util.fail(`section-meta atom at ${start.toString()} must contain at least a title.`, starting.documentPath);
            }

            hasSection = true;
            return util.ok({
                type: 'parse result',
                subResult: title,
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
                rest: trimArray(4, input),
            });
        }
    }

    function isText(internals: IInternals, util: IUtil): HandleValue<Token[], AstPart> {
        return function (input: Token[], current: ILocation): StepParseResult<Token[], AstPart> {
            const token: Token = input[0] as Token;
            if(token.type === 'token - text') {
                return util.ok({
                    type: 'parse result',
                    subResult: {
                        type: 'ast-write',
                        documentOrder: token.location,
                        value: token.text,
                    },
                    location: current.increaseChar(),
                    rest: trimArray(1, input),
                });
            }
            return internals.noResultFound();
        }
    }

    function isContent(internals: IInternals, util: IUtil, externals: readonly ILoad[]) : HandleValue<Token[], AstPart> {
        return function (toParse: Token[], starting: ILocation): StepParseResult<Token[], AstPart> {
            let tocLoc: ILocation = undefined as any;
            let depth: number = 0;
            function tryParseContent(input: Token[], current: ILocation) : StepParseResult<Token[], IContentLocation> {
                if(input.length < 2) {
                    return internals.noResultFound();
                }

                const open = input[0] as Token;
                const atom = input[1] as Token;

                if(open.type !== 'token - open parenthesis') {
                    return internals.noResultFound();
                }

                if(atom.type !== 'token - atom' || atom.text !== 'content') {
                    return internals.noResultFound();
                }
                
                const close = input[2] as Token;

                const length = 
                    close.type === 'token - close parenthesis' ?
                    3 :
                    2;

                if(length < 3) {
                    depth++;
                }

                tocLoc = open.location;

                return util.ok({
                    type: 'parse result',
                    subResult: { 
                        type: 'ast-content',
                        documentOrder: atom.location,
                    },
                    rest: trimArray(length, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseClose(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(input.length < 1) {
                    return internals.noResultFound();
                }

                if(0 === depth) {
                    return internals.noResultFound();
                }

                const close = input[0] as Token;

                if(close.type !== 'token - close parenthesis') {
                    return internals.noResultFound();
                }

                depth--;

                return util.ok({
                    type: 'discard',
                    rest: trimArray(1, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseToc(input: Token[], current: ILocation): StepParseResult<Token[], ITableOfContents> {
                if(input.length < 2) {
                    return internals.noResultFound();
                }

                if(0 === depth) {
                    return internals.noResultFound();
                }

                const open = input[0] as Token;
                const atom = input[1] as Token;

                if(open.type !== 'token - open parenthesis') {
                    return internals.noResultFound();
                }

                if(atom.type !== 'token - atom') {
                    return internals.noResultFound();
                }

                if(atom.text !== 'toc'){
                    return util.fail(`Content at ${tocLoc} contains unknown sub command at ${open.location}`, open.location.documentPath);
                }

                const third = input[2] as Token;
                let lenght = 2;
                let style: AstBulletStyle = 'labeled';

                if(third.type === 'token - close parenthesis') {
                    lenght++;
                }

                if(third.type === 'token - parameter') {
                    lenght += 2;
                    style = third.text as AstBulletStyle;

                    const close = input[3] as Token;
                    if(close.type !== 'token - close parenthesis') {
                        return internals.noResultFound();
                    }
                }

                if(!bulletStyles.includes(style)) {
                    return util.fail(`Toc command at ${open.location} is given unknown bullet style of "${style}"\n exceptable styles are [ ${bulletStyles.map(b => '"' + b + '"').join(", ")} ]`, open.location.documentPath);
                }

                const step: IParseStepForward<Token[]> = {
                    location: current.increaseChar(),
                    rest: trimArray(lenght, input),
                }

                if(style === 'no-table') {
                    return util.ok(
                        internals.buildStepParse(step, {
                            type: 'discard'
                        })
                    );
                }

                return util.ok(
                    internals.buildStepParse(step, {
                        type: 'parse result',
                        subResult: {
                            type: 'ast-toc',
                            bulletStyle: style,
                            documentOrder: tocLoc,
                        }
                    })
                );
            }

            const parser = internals.createArrayParser<Token, AstPart>(tryParseContent, tryParseToc, tryParseClose);
            const parsed = parser.parse(toParse, starting);

            if(!parsed.success) {
                return parsed;
            }

            const [parts, leftovers] = parsed.value;

            if(0 === parts.length) {
                return internals.noResultFound();
            }
            
            if(!hasSection) {
                return util.fail(`Section command must come before the Content command at ${(parts[0] as AstPart).documentOrder}`, starting.documentPath);
            }

            if(0 === externals.length) {
                return util.fail(`Section command at ${(parts[0] as AstPart).documentOrder} needs the section-meta command to have included links.`, starting.documentPath);
            }

            const result: IKeeper<AstPart>[] = 
                parts.
                    sort((a, b) => a.documentOrder.compare(b.documentOrder) * -1).
                    map(r => { return { type: 'keep', keptValue: r }; });

            return util.ok({
                type: 'parse group result',
                subResult: result,
                rest: leftovers.remaining,
                location: leftovers.location,
            });
        };
    }

    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                const document = maybeTokens.value;
                const include: ILoad[] = [];
                const parser = 
                    internals.createArrayParser(
                        isText(internals, util),
                        isHeader(internals, util),
                        isSectionMeta(internals, util, include),
                        isContent(internals, util, include),
                    );
                const parsed = parser.parse(document.tokens, util.toLocation(document.projectLocation, 1, 1));
                
                if(parsed.success) {
                    const [result, _leftovers] = parsed.value;

                    if(0 < result.length) {
                        return util.ok({
                            projectLocation: document.projectLocation,
                            section: {
                                type: 'ast-section',
                                ast: result,
                                documentOrder: util.toLocation(document.projectLocation, 1, 1),
                                include,
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
    singleton: false,
    dependencies: ['internals', 'util']
};

export {
    astParser,
};