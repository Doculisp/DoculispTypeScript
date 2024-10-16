import { AtomAst, CoreAst, IAstCommand, IAstEmpty, RootAst } from "../types/types.ast";
import { DoculispBulletStyle, DoculispPart, IContentLocation, IDoculisp, IDoculispParser, IEmptyDoculisp, IHeader, ILoad, ITableOfContents, ITitle, IWrite } from "../types/types.astDoculisp";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IInternals, IKeeper, StepParseResult } from "../types/types.internal";
import { ITrimArray } from "../types/types.trimArray";

function headerize(depth: number, value: string): string {
    const id = ''.padStart(depth, '#');
    return `${id} ${value} ${id}`;
}

function buildAstParser(internals: IInternals, util: IUtil, trimArray: ITrimArray): IDoculispParser {
    function parse(astResult: Result<RootAst | IAstEmpty>): Result<IDoculisp | IEmptyDoculisp> {
        if(!astResult.success) {
            return astResult;
        }

        let hasInclude = false;

        function parseValue(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IWrite> {
            const ast = input[0] as CoreAst;
    
            if(ast.type !== 'ast-value') {
                return internals.noResultFound();
            }
    
            return util.ok({
                type: 'parse result',
                subResult: {
                    type: 'doculisp-write',
                    documentOrder: ast.location,
                    value: ast.value,
                },
                rest: trimArray.trim(1, input),
                location: current
            });
        }
    
        function parseHeader(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IHeader> {
            const ast = input[0] as CoreAst;
    
            if(ast.value.replaceAll('#', '').length !== 0) {
                return internals.noResultFound();
            }
    
            if(ast.type !== 'ast-command') {
                return util.fail(`Dynamic Header at '${ast.location.documentPath}' Line: ${ast.location.line}, Char: ${ast.location.char} is missing the header text`, current.documentPath);
            }
    
            return util.ok({
                type: 'parse result',
                subResult: {
                    type: 'doculisp-header',
                    depthCount: current.documentDepth + ast.value.length,
                    documentOrder: ast.location,
                    text: ast.parameter.value,
                },
                location: current,
                rest: trimArray.trim(1, input),
            });
        }
    
        function parseSectionMeta(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], ITitle | ILoad> {
            function parseTitle(ast: AtomAst[], location: ILocation, refLink: string | false, subtitle: string | false): Result<ITitle> {
                const titles = ast.filter(s => s.value === 'title');
        
                if(1 < titles.length) {
                    return util.fail(`The section-meta block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} contains more then a single title block.`, current.documentPath);
                }
    
                if(titles.length === 0) {
                    return util.fail(`The section-meta block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} is missing a title block.`, current.documentPath);
                }
        
                const title = titles[0] as AtomAst;
        
                if(title.type === 'ast-atom') {
                    return util.fail(`Title block at '${title.location.documentPath}' Line: ${title.location.line}, Char: ${title.location.char} is missing its title text.`, current.documentPath);
                }
        
                if(title.type === 'ast-container') {
                    const next = title.subStructure[0] as AtomAst;
                    return util.fail(`Title block at '${title.location.documentPath}' Line: ${title.location.line}, Char: ${title.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}`, current.documentPath);
                }
    
                let linkText = title.parameter.value.toLowerCase().replaceAll(' ', '-');
                if(!refLink) {
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
                        linkText = linkText.replaceAll(v, '');
                    });
                }
                linkText = linkText;
    
                return util.ok({
                    type: 'doculisp-title',
                    title: title.parameter.value,
                    documentOrder: title.location,
                    label: headerize(title.location.documentDepth, title.parameter.value),
                    ref_link: '#' + (refLink ? refLink : linkText),
                    subtitle: subtitle ? subtitle : undefined,
                });
            }
    
            function parseSubtitle(ast: AtomAst[], location: ILocation, depth: number): Result<string | false> {
                const subtitles = ast.filter(a => a.value === 'subtitle');
    
                if(subtitles.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < subtitles.length) {
                    return util.fail(`The section-meta block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} has more then one subtitle.`, current.documentPath);
                }
    
                const subtitle = subtitles[0] as AtomAst;
    
                if(subtitle.type === 'ast-atom') {
                    return util.fail(`The subtitle block at '${subtitle.location.documentPath}' Line: ${subtitle.location.line}, Char: ${subtitle.location.char} is missing the subtitle text.`, current.documentPath);
                }
    
                if(subtitle.type === 'ast-container') {
                    const next = subtitle.subStructure[0] as AtomAst;
                    return util.fail(`The subtitle block at '${subtitle.location.documentPath}' Line: ${subtitle.location.line}, Char: ${subtitle.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
                }
    
                return util.ok(headerize(depth, subtitle.parameter.value));
            }
    
            function parseRefLink(ast: AtomAst[], location: ILocation): Result<string | false> {
                const refLinks = ast.filter(a => a.value === 'ref-link');
    
                if(refLinks.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < refLinks.length) {
                    return util.fail(`The section-meta block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} has more then one ref-link.`, current.documentPath);
                }
    
                const refLink = refLinks[0] as AtomAst;
    
                if(refLink.type === 'ast-atom') {
                    return util.fail(`The subtitle block at '${refLink.location.documentPath}' Line: ${refLink.location.line}, Char: ${refLink.location.char} is missing the ref-link text.`, current.documentPath);
                }
    
                if(refLink.type === 'ast-container') {
                    const next = refLink.subStructure[0] as AtomAst;
                    return util.fail(`The ref-link block at '${refLink.location.documentPath}' Line: ${refLink.location.line}, Char: ${refLink.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
                }
    
                return util.ok(refLink.parameter.value);
            }
    
            function parseInclude(ast: AtomAst[], location: ILocation): Result<ILoad[] | false> {
                function parseSections(ast: AtomAst[]): Result<ILoad[]> {
                    const bad = ast.filter(a => a.type !== 'ast-command');
    
                    if(0 < bad.length) {
                        const next = bad[0] as AtomAst;
                        return util.fail(`Include contains unknown command '${next.value}' at '${next.location.documentPath}' Line: ${next.location.line}, Char: ${next.location.char}.`, location.documentPath);
                    }
    
                    const commands = ast as IAstCommand[];
    
                    const loaders = commands.map((a): ILoad => {
                        return {
                            type: 'doculisp-load',
                            document: false,
                            documentOrder: a.location,
                            path: a.parameter.value,
                            sectionLabel: a.value,
                        }
                    });

                    hasInclude = hasInclude || 0 < loaders.length;
    
                    return util.ok(loaders);
                }

                const includes = ast.filter(a => a.value === 'include');
    
                if(includes.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < includes.length) {
                    return util.fail(`The section-meta block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} has more then one include.`, current.documentPath);
                }
                
                const include = includes[0] as AtomAst;
    
                if(include.type === 'ast-atom') {
                    return util.ok(false);
                }
    
                if(include.type === 'ast-command') {
                    return util.fail(`The include block at '${include.location.documentPath}' Line: ${include.location.line}, Char: ${include.location.char} has unknown parameter '${include.parameter.value}'.`, location.documentPath);
                }
    
                return parseSections(include.subStructure);
            }
    
            const sectionMeta = input[0] as CoreAst;
    
            if(sectionMeta.type !== 'ast-container' || sectionMeta.value !== 'section-meta') {
                return internals.noResultFound();
            }
    
            const badSections = sectionMeta.subStructure.filter(a => !['title', 'subtitle', 'ref-link', 'include'].includes(a.value));
    
            if(0 < badSections.length) {
                const next = badSections[0] as AtomAst;
                return util.fail(`The section-meta block at '${sectionMeta.location.documentPath}' Line: ${sectionMeta.location.line}, Char: ${sectionMeta.location.char} contains unknown command '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
            }
    
            const subtitle = parseSubtitle(sectionMeta.subStructure, current, sectionMeta.location.documentDepth + 2);
            
            if(!subtitle.success) {
                return subtitle;
            }
    
            const refLink = parseRefLink(sectionMeta.subStructure, current);
    
            if(!refLink.success) {
                return refLink;
            }
    
            const title = parseTitle(sectionMeta.subStructure, current, refLink.value, subtitle.value);
    
            if(!title.success) {
                return title;
            }
    
            const loaders = parseInclude(sectionMeta.subStructure, current);
    
            if(!loaders.success) {
                return loaders;
            }
    
            const result: (ITitle | ILoad)[] = loaders.value ? loaders.value : [];
            result.push(title.value);
    
    
            return util.ok({
                type: 'parse group result',
                location: current,
                subResult: result.map((r): IKeeper<ITitle | ILoad> => { return { type: 'keep', keptValue: r } }),
                rest: trimArray.trim(1, input),
            });
        }
    
        function parseContent(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IContentLocation | ITableOfContents> {
            function parseToc(ast: AtomAst[], location: ILocation): Result<ITableOfContents | false> {
                const tocs = ast.filter(a => a.value === 'toc');
    
                if(tocs.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < tocs.length) {
                    return util.fail(`The content block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} has more then one toc.`, location.documentPath);
                }
    
                const toc = tocs[0] as AtomAst;
    
                if(toc.type === 'ast-container') {
                    const next = toc.subStructure[0] as AtomAst;
                    return util.fail(`The content block at '${location.documentPath}' Line: ${location.line}, Char: ${location.char} contains unknown command '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, location.documentPath);
                }
    
                const bulletStyle = 
                    (toc.type === 'ast-atom'
                        ? 'labeled'
                        : toc.parameter.value
                    ) as DoculispBulletStyle;
    
                const validStyles: DoculispBulletStyle[] = [
                    'bulleted',
                    'bulleted-labeled',
                    'labeled',
                    'no-table',
                    'numbered',
                    'numbered-labeled',
                    'unlabeled'
                ];
    
                if(!validStyles.includes(bulletStyle)) {
                    return util.fail(`The toc block at '${toc.location.documentPath}' Line: ${toc.location.line}, Char: ${toc.location.char} has unknown bullet style '${bulletStyle}'.`, location.documentPath);
                }
    
                if(bulletStyle === 'no-table') {
                    return util.ok(false);
                }
    
                const docuToc: ITableOfContents = {
                    type: 'doculisp-toc',
                    documentOrder: toc.location.increaseChar(-1),
                    bulletStyle: bulletStyle,
                };
    
                return util.ok(docuToc);
            }
    
            const contentBlock = input[0] as CoreAst;
    
            if(contentBlock.value !== 'content') {
                return internals.noResultFound();
            }
    
            if(contentBlock.type === 'ast-value') {
                return internals.noResultFound();
            }
    
            if(contentBlock.type === 'ast-command') {
                return util.fail(`The content block at '${contentBlock.location.documentPath}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} contains unknown parameter '${contentBlock.parameter.value}'`, current.documentPath);
            }

            if(!hasInclude) {
                return util.fail(`The content block at '${contentBlock.location.documentPath}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} exists without an include block that has external files.`, current.documentPath);
            }
    
            const content: IContentLocation = {
                type: 'doculisp-content',
                documentOrder: contentBlock.location,
            }
    
            if(contentBlock.type === 'ast-atom') {
                return util.ok({
                    type: 'parse result',
                    subResult: content,
                    location: contentBlock.location,
                    rest: trimArray.trim(1, input),
                });
            }
    
            const tocMaybe = parseToc(contentBlock.subStructure, contentBlock.location);
    
            if(!tocMaybe.success) {
                return tocMaybe;
            }
    
            if(!tocMaybe.value) {
                return util.ok({
                    type: 'parse result',
                    subResult: content,
                    location: contentBlock.location,
                    rest: trimArray.trim(1, input),
                });
            }
    
            return util.ok({
                type: 'parse group result',
                subResult: [tocMaybe.value as ITableOfContents, content].map((r): IKeeper<ITableOfContents | IContentLocation> => { return { type: 'keep', keptValue: r } }),
                location: tocMaybe.value.documentOrder,
                rest: trimArray.trim(1, input),
            });
        }
        
        if(astResult.value.type === 'ast-Empty'){
            return util.ok({ type: 'doculisp-empty' });
        }

        const astRoot = astResult.value;
        
        const parser = internals.createArrayParser<CoreAst, DoculispPart | ILoad>(parseValue, parseHeader, parseSectionMeta, parseContent);
        const parsed = parser.parse(astRoot.ast, util.toLocation(astRoot.location, 0, 0));

        if(!parsed.success) {
            return parsed;
        }

        const [result, remaining] = parsed.value;

        if(0 < remaining.remaining.length) {
            const next = remaining.remaining[0] as CoreAst;
            return util.fail(`Unknown atom '${next.value}' at '${next.location.documentPath}' Line: ${next.location.line}, Char: ${next.location.char}`, next.location.documentPath);
        }

        return util.ok({
            projectLocation: astRoot.location,
            section: {
                doculisp: result.filter(d => d.type !== 'doculisp-load') as DoculispPart[],
                include: result.filter(d => d.type === 'doculisp-load') as ILoad[],
                documentOrder: util.toLocation(astRoot.location, 1, 1),
                type: 'doculisp-section'
            },
            type: 'doculisp-root'
        });
    }

    return {
        parse,
    }
}

const doculispParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil, trimArray: ITrimArray) => buildAstParser(internals, util, trimArray),
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray']
};

export {
    doculispParser,
};