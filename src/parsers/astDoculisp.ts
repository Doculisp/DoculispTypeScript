import { Ast, AtomAst, CoreAst, IAstCommand, IAstEmpty, RootAst } from "../types/types.ast";
import { DoculispBulletStyle, DoculispPart, IContentLocation, IDoculisp, IDoculispParser, IEmptyDoculisp, IHeader, ILoad, IPathId, ITableOfContents, ITitle, IWrite } from "../types/types.astDoculisp";
import { IDictionary, IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IInternals, IKeeper, StepParseResult } from "../types/types.internal";
import { ITrimArray } from "../types/types.trimArray";
import { destKey, IVariablePath, IVariableTable } from "../types/types.variableTable";
import { IPath, PathConstructor } from "../types/types.filePath";
import { TextHelper } from "../types/types.textHelpers";

function headerize(depth: number, value: string): string {
    const id = ''.padStart(depth, '#');
    return `${id} ${value} ${id}`;
}

function getSymbolErrorMessage<T extends Ast>(typeId: string, word: string, current: ILocation, ast: T, textHelper: TextHelper): string | false {
    let symbols = textHelper.symbolLocation(word);

    if(symbols) {
        let symbolKeys = Object.keys(symbols);
        let badMsg = symbolKeys.map(badS => `'${badS}' @ id char ${(symbols as IDictionary<number>)[badS]}`).join('\n\t');

        return `Symbol(s) in ${typeId} id ${word}' at '${current.documentPath.fullName}' Line: ${ast.location.line}, Char: ${ast.location.char}\n${badMsg}`;
    }

    return false;
}

function buildAstParser(internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor, textHelper: TextHelper): IDoculispParser {
    function parse(astResult: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp> {
        if(!astResult.success) {
            return astResult;
        }

        let hasSectionMeta = false;
        let hasInclude = false;
        let sectionLinkText: string | false = false;

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
    
            if(ast.value.charAt(0) !== '#') {
                return internals.noResultFound();
            }
    
            if(ast.type !== 'ast-command') {
                return util.fail(`Dynamic Header at '${ast.location.documentPath.fullName}' Line: ${ast.location.line}, Char: ${ast.location.char} is missing the header text`, current.documentPath);
            }

            const id = ast.value.replace(/^#+/, '');

            if(0 < id.length) {
                let errorMsg = getSymbolErrorMessage('heading', id, current, ast, textHelper);
                if(errorMsg) {
                    return util.fail(errorMsg, current.documentPath);
                }

                if(!textHelper.isLowercase(id)) {
                    return util.fail(`Heading id '${id}' at '${current.documentPath.fullName}' Line: ${ast.location.line}, Char: ${ast.location.char} must be lowercase. Did you mean '${id.toLocaleLowerCase()}'?`)
                }

                if(variableTable.hasKey(id)) {
                    let orig = variableTable.getValue(id);
                    let msg = '';
    
                    if(orig && orig.type === 'variable-id') {
                        msg = `\n\tOriginal us of Id was in '${orig.source.documentPath}' Line: ${orig.source.line}, Char: ${orig.source.char}.`;
                    }
                    return util.fail(`Heading id '${id}' at '${current.documentPath.fullName}' Line: ${ast.location.line}, Char: ${ast.location.char} has already been used.${msg}`, current.documentPath);
                }

                const destinationPath = (
                    variableTable.hasKey(destKey) ?
                    (variableTable.getValue(destKey) as IVariablePath).value :
                    false
                );

                if(!destinationPath) {
                    variableTable.addGlobalValue(id, { value: '', type: 'variable-empty-id' });
                } else {
                    variableTable.addGlobalValue(id, { type: 'variable-id', value: destinationPath, source: current, headerLinkText: textHelper.toLinkText(ast.parameter.value) })
                }
            }

            return util.ok({
                type: 'parse result',
                subResult: {
                    type: 'doculisp-header',
                    depthCount: current.documentDepth + ast.value.length - id.length,
                    documentOrder: ast.location,
                    text: ast.parameter.value,
                    id: 0 < id.length ? id : undefined,
                },
                location: current,
                rest: trimArray.trim(1, input),
            });
        }
    
        function parseSectionMeta(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], ITitle | ILoad> {
            function getLinkText(title: IAstCommand, refLink: string | boolean) {
                let linkText = textHelper.toLinkText(title.parameter.value);

                sectionLinkText = linkText;
                return linkText;
            }
            
            function parseTitle(ast: AtomAst[], location: ILocation, refLink: string | false, subtitle: string | false): Result<ITitle> {
                const titles = ast.filter(s => s.value === 'title');
        
                if(1 < titles.length) {
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} contains more then a single title block.`, current.documentPath);
                }
    
                if(titles.length === 0) {
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} is missing a title block.`, current.documentPath);
                }
        
                const title = titles[0] as AtomAst;
        
                if(title.type === 'ast-atom') {
                    return util.fail(`Title block at '${title.location.documentPath.fullName}' Line: ${title.location.line}, Char: ${title.location.char} is missing its title text.`, current.documentPath);
                }
        
                if(title.type === 'ast-container') {
                    const next = title.subStructure[0] as AtomAst;
                    return util.fail(`Title block at '${title.location.documentPath.fullName}' Line: ${title.location.line}, Char: ${title.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}`, current.documentPath);
                }
    
                let linkText = getLinkText(title, refLink);

                const idResult = parseId(ast, current);
                if(!idResult.success) {
                    return idResult;
                }

                const id = idResult.value;
    
                return util.ok({
                    type: 'doculisp-title',
                    title: title.parameter.value,
                    documentOrder: title.location,
                    label: headerize(title.location.documentDepth, title.parameter.value),
                    ref_link: '#' + (refLink ? refLink : linkText),
                    subtitle: subtitle ? subtitle : undefined,
                    id: id ? id : undefined,
                });
            }

            function parseSubtitle(ast: AtomAst[], location: ILocation, depth: number): Result<string | false> {
                const subtitles = ast.filter(a => a.value === 'subtitle');
    
                if(subtitles.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < subtitles.length) {
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has more then one subtitle.`, current.documentPath);
                }
    
                const subtitle = subtitles[0] as AtomAst;
    
                if(subtitle.type === 'ast-atom') {
                    return util.fail(`The subtitle block at '${subtitle.location.documentPath.fullName}' Line: ${subtitle.location.line}, Char: ${subtitle.location.char} is missing the subtitle text.`, current.documentPath);
                }
    
                if(subtitle.type === 'ast-container') {
                    const next = subtitle.subStructure[0] as AtomAst;
                    return util.fail(`The subtitle block at '${subtitle.location.documentPath.fullName}' Line: ${subtitle.location.line}, Char: ${subtitle.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
                }
    
                return util.ok(headerize(depth, subtitle.parameter.value));
            }
    
            function parseRefLink(ast: AtomAst[], location: ILocation): Result<string | false> {
                const refLinks = ast.filter(a => a.value === 'ref-link');
    
                if(refLinks.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < refLinks.length) {
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has more then one ref-link.`, current.documentPath);
                }
    
                const refLink = refLinks[0] as AtomAst;
    
                if(refLink.type === 'ast-atom') {
                    return util.fail(`The subtitle block at '${refLink.location.documentPath.fullName}' Line: ${refLink.location.line}, Char: ${refLink.location.char} is missing the ref-link text.`, current.documentPath);
                }
    
                if(refLink.type === 'ast-container') {
                    const next = refLink.subStructure[0] as AtomAst;
                    return util.fail(`The ref-link block at '${refLink.location.documentPath.fullName}' Line: ${refLink.location.line}, Char: ${refLink.location.char} contains unknown block '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
                }
    
                return util.ok(refLink.parameter.value);
            }
    
            function parseInclude(ast: AtomAst[], location: ILocation): Result<ILoad[] | false> {
                function parseSections(ast: AtomAst[]): Result<ILoad[]> {
                    const bad = ast.filter(a => a.type !== 'ast-command');
    
                    if(0 < bad.length) {
                        const next = bad[0] as AtomAst;
                        return util.fail(`Include contains unknown command '${next.value}' at '${next.location.documentPath.fullName}' Line: ${next.location.line}, Char: ${next.location.char}.`, location.documentPath);
                    }
    
                    const commands = ast as IAstCommand[];
    
                    const loaders = commands.map((rawLoad): ILoad => {
                        return {
                            type: 'doculisp-load',
                            document: false,
                            documentOrder: rawLoad.location,
                            path: pathConstructor(rawLoad.parameter.value),
                            sectionLabel: rawLoad.value.replaceAll('-', ' '),
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
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has more then one include.`, current.documentPath);
                }
                
                const include = includes[0] as AtomAst;
    
                if(include.type === 'ast-atom') {
                    return util.ok(false);
                }
    
                if(include.type === 'ast-command') {
                    return util.fail(`The include block at '${include.location.documentPath.fullName}' Line: ${include.location.line}, Char: ${include.location.char} has unknown parameter '${include.parameter.value}'.`, location.documentPath);
                }
    
                return parseSections(include.subStructure);
            }

            function parseAuthor(ast: AtomAst[], location: ILocation): Result<false> {
                const authors = ast.filter(a => a.value === 'author');

                for (let index = 0; index < authors.length; index++) {
                    const author = authors[index] as AtomAst;
                    if(author.type === 'ast-atom') {
                        return util.fail(`Author block at '${author.location.documentPath.fullName}' Line: ${author.location.line}, Char: ${author.location.char} does not contain the author's name.`, location.documentPath);
                    }

                    if(author.type === 'ast-container') {
                        const child = author.subStructure[0] as AtomAst;
                        return util.fail(`Author block at '${author.location.documentPath.fullName}' Line: ${author.location.line}, Char: ${author.location.char} contains unknown child block of '${child.value}' at Line: ${child.location.line}, Char: ${child.location.char}.`, location.documentPath);
                    }

                    variableTable.addValueToStringList('author', { value: author.parameter.value, type: 'variable-string' });
                }

                return util.ok(false);
            }

            function parseId(ast: AtomAst[], location: ILocation): Result<string | false> {
                const ids = ast.filter(a => a.value === 'id');

                if(ids.length === 0) {
                    return util.ok(false);
                }
                
                if(1 < ids.length) {
                    return util.fail(`The section-meta block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has more then one id.`, current.documentPath);
                }
                
                const idAtom = ids[0] as AtomAst;

                if(idAtom.type === 'ast-container') {
                    return util.fail(`The section id block at '${idAtom.location.documentPath.fullName}' Line: ${idAtom.location.line}, Char: ${idAtom.location.char} contains sub blocks.`, current.documentPath);
                }

                if(idAtom.type === 'ast-atom') {
                    return util.fail(`The section id block at '${idAtom.location.documentPath.fullName}' Line: ${idAtom.location.line}, Char: ${idAtom.location.char} is missing identifier text parameter.`, current.documentPath);
                }

                const id = idAtom.parameter.value;

                const errorMsg = getSymbolErrorMessage('section', id, current, idAtom, textHelper);
                if(errorMsg) {
                    return util.fail(errorMsg, current.documentPath);
                }

                if(!textHelper.isLowercase(id)) {
                    return util.fail(`Section id '${id}' at '${current.documentPath.fullName}' Line: ${idAtom.location.line}, Char: ${idAtom.location.char} contains must be lowercase. Did you mean '${id.toLocaleLowerCase()}'?`, current.documentPath)
                }

                if(variableTable.hasKey(id)) {
                    let orig = variableTable.getValue(id);
                    let msg = '';
    
                    if(orig && orig.type === 'variable-id') {
                        msg = `\n\tOriginal us of Id was in '${orig.source.documentPath}' Line: ${orig.source.line}, Char: ${orig.source.char}.`;
                    }
                    return util.fail(`Section id '${id}' at '${current.documentPath.fullName}' Line: ${idAtom.location.line}, Char: ${idAtom.location.char} has already been used.${msg}`, current.documentPath);
                }

                const destinationPath = (
                    variableTable.hasKey(destKey) ?
                    (variableTable.getValue(destKey) as IVariablePath).value :
                    false
                );

                if(!destinationPath) {
                    variableTable.addGlobalValue(id, { value: '', type: 'variable-empty-id' });
                } else {
                    variableTable.addGlobalValue(id, { value: destinationPath, source: location, type: 'variable-id', headerLinkText: sectionLinkText ? sectionLinkText : false });
                }

                return util.ok(id);
            }
    
            const sectionMeta = input[0] as CoreAst;

            if(sectionMeta.type === 'ast-command' && sectionMeta.value === 'section-meta') {
                hasSectionMeta = true;

                const title: ITitle = {
                    type: 'doculisp-title',
                    title: sectionMeta.parameter.value,
                    documentOrder: sectionMeta.location,
                    label: headerize(sectionMeta.location.documentDepth, sectionMeta.parameter.value),
                    ref_link: '#' + getLinkText(sectionMeta, false),
                };

                return util.ok({
                    type: 'parse result',
                    location: current,
                    subResult: title,
                    rest: trimArray.trim(1, input),
                });
            }
    
            if(sectionMeta.type !== 'ast-container' || sectionMeta.value !== 'section-meta') {
                return internals.noResultFound();
            }

            if(hasSectionMeta) {
                return util.fail(`The section-meta block at '${sectionMeta.location.documentPath.fullName}' Line: ${sectionMeta.location.line}, Char: ${sectionMeta.location.char} is a duplicate block. Only one section-meta block allowed per file.`, current.documentPath);
            }
    
            const badSections = sectionMeta.subStructure.filter(a => !['title', 'subtitle', 'ref-link', 'include', 'author', 'id'].includes(a.value));
    
            if(0 < badSections.length) {
                const next = badSections[0] as AtomAst;
                return util.fail(`The section-meta block at '${sectionMeta.location.documentPath.fullName}' Line: ${sectionMeta.location.line}, Char: ${sectionMeta.location.char} contains unknown command '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
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

            const authors = parseAuthor(sectionMeta.subStructure, current);

            if(!authors.success){
                return authors;
            }
    
            const loaders = parseInclude(sectionMeta.subStructure, current);
    
            if(!loaders.success) {
                return loaders;
            }

            const result: (ITitle | ILoad)[] = loaders.value ? loaders.value : [];
            result.push(title.value);

            hasSectionMeta = true;
    
            return util.ok({
                type: 'parse group result',
                location: current,
                subResult: result.map((r): IKeeper<ITitle | ILoad> => { return { type: 'keep', keptValue: r } }),
                rest: trimArray.trim(1, input),
            });
        }
    
        function parseContent(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IContentLocation | ITableOfContents> {
            function parseBulletStyle(bulletStyle: string | undefined, location: ILocation, documentPath: IPath) : Result<DoculispBulletStyle> {
                if(!bulletStyle) {
                    return util.ok('labeled');
                }

                const validStyles: DoculispBulletStyle[] = [
                    'bulleted',
                    'bulleted-labeled',
                    'labeled',
                    'no-table',
                    'numbered',
                    'numbered-labeled',
                    'unlabeled'
                ];
    
                if(!validStyles.includes(bulletStyle as DoculispBulletStyle)) {
                    return util.fail(`The toc block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has unknown bullet style '${bulletStyle}'.`, documentPath);
                }

                return util.ok(bulletStyle as DoculispBulletStyle);
            }

            function parseToc(ast: AtomAst[], location: ILocation): Result<ITableOfContents | false> {
                const tocs = ast.filter(a => a.value === 'toc');
    
                if(tocs.length === 0) {
                    return util.ok(false);
                }
    
                if(1 < tocs.length) {
                    return util.fail(`The content block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} has more then one toc.`, location.documentPath);
                }
    
                const toc = tocs[0] as AtomAst;
    
                if(toc.type === 'ast-container') {
                    if(2 < toc.subStructure.length) {
                        const err = toc.subStructure[toc.subStructure.length -1] as AtomAst;
                        return util.fail(`The content block at '${location.documentPath.fullName} Line: ${err.location.line}, Char: ${err.location.char}' has ${toc.subStructure.length} block and can only have 0, 1, or 2 blocks`, location.documentPath);
                    }

                    const first = toc.subStructure[0] as AtomAst;
                    if(first.type !== 'ast-command' || !['label', 'style'].includes(first.value)){
                        return util.fail(`The content block at '${location.documentPath.fullName}' Line: ${location.line}, Char: ${location.char} contains unknown command '${first.value}' at Line: ${first.location.line}, Char: ${first.location.char}.`, location.documentPath);
                    }
                    
                    let labelText: string | false = false;
                    let bulletStyle: DoculispBulletStyle = 'labeled';

                    if(first.value === 'label') {
                        labelText = first.parameter.value;
                    }

                    if(first.value === 'style') {
                        const typeMaybe = parseBulletStyle(first.parameter.value, toc.location, location.documentPath);
                        if(!typeMaybe.success) {
                            return typeMaybe;
                        }

                        bulletStyle = typeMaybe.value;
                    }

                    if(1 < toc.subStructure.length) {
                        const second = toc.subStructure[1] as AtomAst;

                        if(second.type !== 'ast-command' || !['label', 'style'].includes(second.value)) {
                            return util.fail(`The content block at '${location.documentPath.fullName}' Line: ${second.location.line}, Char: ${second.location.char} contains unknown command '${first.value}' at Line: ${first.location.line}, Char: ${first.location.char}.`, location.documentPath);
                        }

                        if(first.value === second.value) {
                            return util.fail(`The content block at '${location.documentPath.fullName}' Line ${location.line}, Char: ${location.line} has a duplicate '${first.value}' block at Line: ${second.location.line}, Char: ${second.location.char}.`, location.documentPath);
                        }

                        if(second.value === 'label') {
                            labelText = second.parameter.value;
                        }
    
                        if(second.value === 'style') {
                            const typeMaybe = parseBulletStyle(second.parameter.value, toc.location, location.documentPath);
                            if(!typeMaybe.success) {
                                return typeMaybe;
                            }
    
                            bulletStyle = typeMaybe.value;
                        }
                    }

                    const docuToc: ITableOfContents = {
                        type: 'doculisp-toc',
                        label: labelText ? headerize(location.documentDepth + 1, labelText) : labelText,
                        documentOrder: toc.location.increaseChar(-1),
                        bulletStyle: bulletStyle,
                    };
        
                    return util.ok(docuToc);
                }
                else {
                    const style = (toc.type === 'ast-atom') ? undefined : toc.parameter.value;
                    const bulletStyleMaybe = parseBulletStyle(style, toc.location, location.documentPath);

                    if(!bulletStyleMaybe.success) {
                        return bulletStyleMaybe;
                    }
        
                    const bulletStyle = bulletStyleMaybe.value
        
                    if(bulletStyle === 'no-table') {
                        return util.ok(false);
                    }
        
                    const docuToc: ITableOfContents = {
                        type: 'doculisp-toc',
                        label: false,
                        documentOrder: toc.location.increaseChar(-1),
                        bulletStyle: bulletStyle,
                    };
        
                    return util.ok(docuToc);
                }
            }
    
            const contentBlock = input[0] as CoreAst;
    
            if(contentBlock.value !== 'content') {
                return internals.noResultFound();
            }
    
            if(contentBlock.type === 'ast-value') {
                return internals.noResultFound();
            }
    
            if(contentBlock.type === 'ast-command') {
                return util.fail(`The content block at '${contentBlock.location.documentPath.fullName}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} contains unknown parameter '${contentBlock.parameter.value}'`, current.documentPath);
            }

            if(!hasSectionMeta) {
                return util.fail(`The content block at '${contentBlock.location.documentPath.fullName}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} exists before the section-meta block.`, current.documentPath);
            }

            if(!hasInclude) {
                return util.fail(`The content block at '${contentBlock.location.documentPath.fullName}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} exists without an include block that has external files.`, current.documentPath);
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

            const bad = contentBlock.subStructure.filter(a => a.value !== 'toc');

            if(0 < bad.length) {
                const next = bad[0] as AtomAst;
                return util.fail(`The content block at '${contentBlock.location.documentPath.fullName}' Line: ${contentBlock.location.line}, Char: ${contentBlock.location.char} has unknown command '${next.value}' at Line: ${next.location.line}, Char: ${next.location.char}.`, current.documentPath);
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

        function parsePath(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], IPathId> {
            const pathIdBlock = input[0] as CoreAst;
            if(pathIdBlock.type === 'ast-value') {
                return internals.noResultFound();
            }

            if(pathIdBlock.value !== 'get-path') {
                return internals.noResultFound();
            }

            if(pathIdBlock.type === 'ast-atom') {
                return util.fail(`get-path command at "${current.documentPath.fullName}" line: ${pathIdBlock.location.line}, char: ${pathIdBlock.location.char} is missing parameter.`, current.documentPath);
            }

            if(pathIdBlock.type === 'ast-container') {
                return util.fail(`get-path command at "${current.documentPath.fullName}" line: ${pathIdBlock.location.line}, char: ${pathIdBlock.location.char} contains unknown sub structure.`);
            }

            return util.ok({
                type: 'parse result',
                location: current,
                subResult: {
                    type: 'doculisp-path-id',
                    id: pathIdBlock.parameter.value,
                    documentOrder: pathIdBlock.location,
                },
                rest: trimArray.trim(1, input),
            });
        }
        
        if(astResult.value.type === 'ast-Empty'){
            return util.ok({ type: 'doculisp-empty' });
        }

        const astRoot = astResult.value;
        
        const parser = internals.createArrayParser<CoreAst, DoculispPart | ILoad>(parseValue, parseHeader, parseSectionMeta, parseContent, parsePath);
        const parsed = parser.parse(astRoot.ast, util.toLocation(astRoot.location, 0, 0));

        if(!parsed.success) {
            return parsed;
        }

        const [result, remaining] = parsed.value;

        if(0 < remaining.remaining.length) {
            const next = remaining.remaining[0] as CoreAst;
            return util.fail(`Unknown atom '${next.value}' at '${next.location.documentPath.fullName}' Line: ${next.location.line}, Char: ${next.location.char}`, next.location.documentPath);
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
    builder: (internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor, textHelper: TextHelper) => buildAstParser(internals, util, trimArray, pathConstructor, textHelper),
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray', 'pathConstructor', 'textHelpers']
};

export {
    doculispParser,
};