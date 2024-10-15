import { AstBulletStyle, DoculispPart, IDoculisp, IDoculispParser, IContentLocation, ILoad, ITableOfContents, ITitle, bulletStyles } from "../types/types.astDoculisp";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { DiscardedResult, HandleValue, IInternals, IKeeper, IParseStepForward, StepParseResult } from "../types/types.internal";
import { IRootStructure, IStructure } from "../types/types.structure";
import { Token, TokenizedDocument } from "../types/types.tokens";

function buildAstParser(internals: IInternals, util: IUtil, structureRoot: IRootStructure): IDoculispParser {
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
            const sectionMetaBlock = 
                structureRoot.SubAtoms.getStructureForSubAtom('section-meta') as IStructure;

            function tryParseError(input: Token[], _current: ILocation): DiscardedResult<Token[]> {
                if(!start || depth < 1) {
                    return internals.noResultFound();
                }
                
                if(input.length < 1) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;

                if(atom.type !== 'token - atom') {
                    return internals.noResultFound();
                }

                if(!!sectionMetaBlock.hasSubAtom && !sectionMetaBlock.hasSubAtom.isValidSubAtom(atom.text)) {
                    return util.fail(`Atom of '${atom.text}' at ${atom.location} is not expected as part of section-meta.`, atom.location.documentPath);
                }

                return internals.noResultFound();
            }

            function tryParseSectionMeta(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(input.length < 1) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;

                if(atom.type !== 'token - atom' || atom.text !== 'section-meta') {
                    return internals.noResultFound();
                }

                if(start && 0 < depth) {
                    return util.fail(`A nested Section-Meta command at ${atom.location}.`, atom.location.documentPath);
                }

                if(start) {
                    return util.fail(`A second Section-Meta command was detected at ${atom.location}`, atom.location.documentPath);
                }

                depth++;
                start = atom.location;

                return util.ok({
                    type: 'discard',
                    location: current.increaseChar(),
                    rest: trimArray(1, input),
                });
            }

            function tryParseTitle(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 2) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;
                const param = input[1] as Token;

                if(atom.type !== 'token - atom' || atom.text !== 'title') {
                    return internals.noResultFound();
                }

                if(param.type !== 'token - parameter') {
                    return util.fail(`Title at ${atom.location.toString()} does not contain title text.`, atom.location.documentPath);
                }

                const close = input[2] as Token;
                if(input.length < 3 || close.type !== 'token - close parenthesis') {
                    return internals.noResultFound();
                }

                let text: string = param.text;
                [
                    '.', 
                    ',',
                    '!',
                    '@',
                    '#',
                    '$',
                    '%',
                    '^',
                    '&',
                    '*',
                    '(',
                    ')',
                    '=',
                    '+',
                    '{',
                    '[',
                    '}',
                    ']',
                    '|',
                    '\\',
                    ':',
                    ';',
                    "'",
                    '"',
                    '`',
                    '<',
                    ',',
                    '>',
                    '.',
                    '?',
                    '/',
                ].forEach(v => {
                    text = text.replaceAll(v, '');
                })

                const ref_link = (
                    linkText ? 
                    linkText :
                    '#' + text.toLocaleLowerCase().replaceAll(' ', '-')
                );

                const label = headerize(atom.location.documentDepth, param.text);
                const subtitle: string | undefined = 
                    subTitleText ?
                    subTitleText :
                    undefined;

                title = {
                    type: 'ast-title',
                    title: param.text,
                    subtitle,
                    label,
                    ref_link,
                    documentOrder: start,
                };

                return util.ok({
                    type: 'discard',
                    rest: trimArray(3, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseLink(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 2) {
                    return internals.noResultFound();
                }

                const ref_link = input[0] as Token;
                const param = input[1] as Token;

                if(ref_link.type !== 'token - atom' || ref_link.text !== 'ref-link') {
                    return internals.noResultFound()
                }

                if(param.type !== 'token - parameter') {
                    return util.fail(`the Ref-Link Command at ${ref_link.location.toString()} does not have a ref-link text.`, ref_link.location.documentPath);
                }

                const close = input[2] as Token;
                if(input.length < 4 || close.type !== 'token - close parenthesis') {
                    return internals.noResultFound();
                }

                linkText = '#' + param.text;

                if(title) {
                    const n: ITitle = {
                        type: 'ast-title',
                        label: title.label,
                        title: title.title,
                        ref_link: linkText,
                        documentOrder: title.documentOrder,
                    }

                    title = n;
                }

                return util.ok({
                    type: 'discard',
                    rest: trimArray(3, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseSubtitle(input: Token[], current: ILocation): DiscardedResult<Token[]> {    
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 3) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;
                const param = input[1] as Token;

                if(atom.type !== 'token - atom' || atom.text !== 'subtitle') {
                    return internals.noResultFound();
                }

                if(param.type !== 'token - parameter') {
                    return util.fail(`The Subtitle command at ${atom.location} does not contain subtitle text.`, atom.location.documentPath);
                }

                const close = input[2] as Token;
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
                        ref_link: title.ref_link,
                        documentOrder: title.documentOrder,
                    };

                    title = nt;
                }

                subTitleText = text;
                return util.ok({
                    type: 'discard',
                    rest: trimArray(3, input),
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

                if(input.length < 3) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;
                const param = input[1] as Token;

                if(atom.type !== 'token - atom') {
                    return internals.noResultFound();
                }

                if(param.type !== 'token - parameter') {
                    return util.fail(`Section command named "${atom.text}" at ${atom.location} does not have a section title.`, atom.location.documentPath);
                }

                const close = input[2] as Token;
                if(close.type !== 'token - close parenthesis') {
                    return internals.noResultFound();
                }

                const load: ILoad = {
                    type: 'ast-load',
                    sectionLabel: atom.text,
                    path: param.text,
                    documentOrder: atom.location,
                    document: false,
                }

                return util.ok({
                    type: 'parse result',
                    subResult: load,
                    rest: trimArray(3, input),
                    location: current.increaseChar(),
                });
            }

            function tryParseInclude(input: Token[], current: ILocation): DiscardedResult<Token[]> {
                if(!start) {
                    return internals.noResultFound();
                }

                if(input.length < 2) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;


                if(atom.type !== 'token - atom' || atom.text !== 'include') {
                    return internals.noResultFound();
                }

                input = trimArray(1, input);
                depth++;

                const parser = internals.createArrayParser<Token, ILoad>(trySubParseLoadable, tryParseClose);
                const parsed = parser.parse(input, current.increaseChar());

                if(!parsed.success) {
                    return parsed;
                }

                const [rawResult, leftovers] = parsed.value;
                const result = rawResult as ILoad[];

                if(0 === result.length) {
                    return util.fail(`Include command at ${atom.location} does not contain any section information.`, atom.location.documentPath);
                }

                result.forEach(r => include.push(r));

                return util.ok({
                    type: 'discard',
                    rest: leftovers.remaining,
                    location: current.increaseChar(),
                });
            }

            const parser = internals.createArrayParser<Token, DoculispPart>(tryParseError, tryParseSectionMeta, tryParseTitle, tryParseClose, tryParseLink, tryParseSubtitle, tryParseInclude);
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

    function isHeader(internals: IInternals, util: IUtil): HandleValue<Token[], DoculispPart> {
        return function (input: Token[], current: ILocation): StepParseResult<Token[], DoculispPart> {
            if(input.length < 2) {
                return internals.noResultFound();
            }

            let atom = input[0] as Token;
            let param = input[1] as Token;

            if(atom.type !== 'token - atom' || !atom.text.startsWith('#')) {
                return internals.noResultFound();
            }

            if(param.type !== 'token - parameter') {
                return util.fail(`Header at ${atom.location.toString()} has no header text.`, atom.location.documentPath);
            }

            let close = input[2] as Token;
            if(input.length < 3 || close.type !== 'token - close parenthesis') {
                return util.fail(`Header at ${atom.location.toString()} has unexpected character at ${close.location.toString()}`, close.location.documentPath);
            }

            const match: string = (atom.text.match(/#+/) as any)[0];

            if(match.length !== atom.text.length) {
                return util.fail(`Header at ${atom.location.toString()} has invalid syntax.`, atom.location.documentPath);
            }

            const part: DoculispPart = {
                type: 'ast-header',
                depthCount: atom.text.length + atom.location.documentDepth,
                text: param.text,
                documentOrder: atom.location,
            };

            return util.ok({
                type: 'parse result',
                subResult: part,
                location: current.increaseChar(),
                rest: trimArray(3, input),
            });
        }
    }

    function isText(internals: IInternals, util: IUtil): HandleValue<Token[], DoculispPart> {
        return function (input: Token[], current: ILocation): StepParseResult<Token[], DoculispPart> {
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

    function isContent(internals: IInternals, util: IUtil, externals: readonly ILoad[]) : HandleValue<Token[], DoculispPart> {
        return function (toParse: Token[], starting: ILocation): StepParseResult<Token[], DoculispPart> {
            let tocLoc: ILocation = undefined as any;
            let depth: number = 0;
            function tryParseContent(input: Token[], current: ILocation) : StepParseResult<Token[], IContentLocation> {
                if(input.length < 1) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;

                if(atom.type !== 'token - atom' || atom.text !== 'content') {
                    return internals.noResultFound();
                }
                
                const close = input[1] as Token;

                const length = 
                    close.type === 'token - close parenthesis' ?
                    2 :
                    1;

                if(length < 2) {
                    depth++;
                }

                tocLoc = atom.location.increaseChar(-1);

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
                if(input.length < 1) {
                    return internals.noResultFound();
                }

                if(0 === depth) {
                    return internals.noResultFound();
                }

                const atom = input[0] as Token;

                if(atom.type !== 'token - atom') {
                    return internals.noResultFound();
                }

                if(atom.text !== 'toc'){
                    return util.fail(`Content at ${tocLoc} contains unknown sub command at ${atom.location}`, atom.location.documentPath);
                }

                const third = input[1] as Token;
                let length = 1;
                let style: AstBulletStyle = 'labeled';

                if(third.type === 'token - close parenthesis') {
                    length++;
                }

                if(third.type === 'token - parameter') {
                    length += 2;
                    style = third.text as AstBulletStyle;

                    const close = input[2] as Token;
                    if(input.length < 3 || close.type !== 'token - close parenthesis') {
                        return internals.noResultFound(); // Should be an error.
                    }
                }

                if(!bulletStyles.includes(style)) {
                    return util.fail(`Toc command at ${atom.location} is given unknown bullet style of "${style}"\n exceptable styles are [ ${bulletStyles.map(b => '"' + b + '"').join(", ")} ]`, atom.location.documentPath);
                }

                const step: IParseStepForward<Token[]> = {
                    location: current.increaseChar(),
                    rest: trimArray(length, input),
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

            const parser = internals.createArrayParser<Token, DoculispPart>(tryParseContent, tryParseToc, tryParseClose);
            const parsed = parser.parse(toParse, starting);

            if(!parsed.success) {
                return parsed;
            }

            const [parts, leftovers] = parsed.value;

            if(0 === parts.length) {
                return internals.noResultFound();
            }
            
            if(!hasSection) {
                return util.fail(`Section command must come before the Content command at ${(parts[0] as DoculispPart).documentOrder}`, starting.documentPath);
            }

            if(0 === externals.length) {
                return util.fail(`Section command at ${(parts[0] as DoculispPart).documentOrder} needs the section-meta command to have included links.`, starting.documentPath);
            }

            const result: IKeeper<DoculispPart>[] = 
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
        parse(maybeTokens: Result<TokenizedDocument>): Result<IDoculisp> {
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
    builder: (internals: IInternals, util: IUtil, structure: IRootStructure) => buildAstParser(internals, util, structure),
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'structure']
};

export {
    astParser,
};