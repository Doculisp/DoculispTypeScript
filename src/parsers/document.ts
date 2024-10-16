import { IRegisterable, Valid } from "../types/types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types/types.document";
import { ILocation, IProjectLocation, IUtil, Result, isSame } from "../types/types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types/types.textHelpers";
import { HandleStringValue, IInternals, IParseStepForward, IStringParseStepForward, StringStepParseResult } from "../types/types.internal";

function createMap(projectLocation: IProjectLocation, parts: DocumentPart[]): DocumentMap {
    return {
        projectLocation,
        parts,
    };
}

type ParesBuilder = {
    isDiscardedWhiteSpace(): HandleStringValue<DocumentPart>;
    isDiscardedNewline(): HandleStringValue<DocumentPart>;
    isKeptWhiteSpace(): HandleStringValue<DocumentPart>;
    isMultiline() : HandleStringValue<DocumentPart>;
    isInline(): HandleStringValue<DocumentPart>;
    isDoculisp(isOpen?: boolean): HandleStringValue<DocumentPart>;
    isComment(): HandleStringValue<DocumentPart>;
    isWord(): HandleStringValue<DocumentPart>;
};

function getPartParsers(projectLocation: IProjectLocation, doesIt: IDocumentSearches, internals: IInternals, util: IUtil): ParesBuilder {
    function isStopParsingWhiteSpace(input: string, _current: ILocation): Result<'stop' | false> {
        const regex = /^\S+/;
        if(regex.test(input)) {
            return internals.stopFindingResults();
        }
        return internals.noResultFound();
    }

    function doesItStartWithDiscarded(startsWith: RegExp, incrementor: (current: ILocation, foundLength: number) => ILocation): HandleStringValue<DocumentPart> {
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            if(startsWith.test(input)) {
                const found: string = (input.match(startsWith) as any)[0];
                return util.ok({
                    type: 'discard',
                    rest: input.slice(found.length),
                    location: incrementor(current, found.length),
                });
            }
            return internals.noResultFound();
        }
    }

    function doesItStartWithKeep(startsWith: RegExp, incrementor: (current: ILocation, foundLength: number) => ILocation): HandleStringValue<DocumentPart> {
        return function (input:string, current: ILocation): StringStepParseResult<DocumentPart> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);
                const location = incrementor(current, parsed.length);
                return util.ok({
                    type: 'parse result',
                    subResult: { location: location, text: parsed, type: 'text' },
                    rest,
                    location: location,
                });
            }
            return internals.noResultFound();
        }
    }

    function isDiscardedNewline(): HandleStringValue<DocumentPart> {
        const createParser = internals.createStringParser<DocumentPart>;
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l.increaseLine());
            const isNewline = doesItStartWithDiscarded(doesIt.startWithAnyNewline, l => l.increaseLine());

            function stopParsing(): StringStepParseResult<DocumentPart> {
                return internals.stopFindingResults();
            }
    
            const whiteSpaceParser = createParser(isWindows, isNewline, stopParsing);
            const parsed = whiteSpaceParser.parse(input, current);
            if(parsed.success) {
                const [_, leftovers] = parsed.value;
                if(leftovers.remaining === input) {
                    return internals.noResultFound();
                } else {
                    return util.ok({
                        type: 'discard',
                        rest: leftovers.remaining,
                        location: leftovers.location,
                    });
                }
            } else {
                return parsed;
            }
        }
    }

    function isDiscardedWhiteSpace(): HandleStringValue<DocumentPart> {
        const createParser = internals.createStringParser<DocumentPart>;
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l.increaseLine());
            const isLinux = doesItStartWithDiscarded(doesIt.startWithLinuxNewline, l => l.increaseLine());
            const isMac = doesItStartWithDiscarded(doesIt.startWithMacsNewline, l => l.increaseLine());
            const isWhiteSpace = doesItStartWithDiscarded(doesIt.startWithNonNewLineWhiteSpace, (l, f) => l.increaseChar(f));
    
            const whiteSpaceParser = createParser(isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace);
            const parsed = whiteSpaceParser.parse(input, current);
            if(parsed.success) {
                const [_, leftovers] = parsed.value;
                if(leftovers.remaining === input) {
                    return internals.noResultFound();
                } else {
                    return util.ok({
                        type: 'discard',
                        rest: leftovers.remaining,
                        location: leftovers.location,
                    });
                }
            } else {
                return parsed;
            }
        }
    }

    function isKeptWhiteSpace(): HandleStringValue<DocumentPart> {
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            const isWindows = doesItStartWithKeep(doesIt.startWithWindowsNewline, l => l.increaseLine());
            const isNewline = doesItStartWithKeep(doesIt.startWithAnyNewline, l => l.increaseLine());
            const isWhiteSpace = doesItStartWithKeep(doesIt.startWithNonNewLineWhiteSpace, (l, f) => l.increaseChar(f));
    
            const parser = internals.createStringParser(isWindows, isNewline, isWhiteSpace, isStopParsingWhiteSpace)
            const parsed = parser.parse(input, current);
            if(parsed.success) {
                const [result, leftover] = parsed.value;
                if(leftover.location.compare(current) === isSame) {
                    return internals.noResultFound();
                }
    
                let step: IStringParseStepForward = {
                    rest: leftover.remaining,
                    location: leftover.location,
                }
    
                if(0 === result.length) {
                    return util.ok(internals.buildStepParse(step, {
                        type: 'discard',
                    }));
                }
                
                function toCleanPart(source: DocumentPart): DocumentPart{
                    const part: DocumentPart = {
                        location: source.location,
                        text: source.text.replaceAll('\r\n', '\n').replaceAll('\r', '\n'),
                        type: source.type,
                    };
                    return part;
                }
    
                if(1 === result.length) {
                    
                    return util.ok(internals.buildStepParse(step, {
                        type: 'parse result',
                        subResult: toCleanPart(result[0] as DocumentPart),
                    }));
                }
    
                return util.ok(internals.buildStepParse(step, {
                    type: 'parse group result',
                    subResult: result.map(r => { return { type:'keep', keptValue: toCleanPart(r) }; }),
                }));
            }
    
            return parsed;
        }
    }

    function isMultiline() : HandleStringValue<DocumentPart> {
        return function(toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
    
            function tryParseMultiline(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithMultilineMarker.test(input)) {
                    opened = !opened;
    
                    const parsed: string = (input.match(doesIt.startWithMultilineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
                    const location = current.increaseChar(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: { location: location, text: parsed.replaceAll('\r\n', '\n').replaceAll('\r', '\n'), type: 'text' },
                        rest,
                        location: location,
                    });
                }
                return internals.noResultFound();
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation) {
                if(!opened) {
                    return internals.stopFindingResults();
                }
                return isKeptWhiteSpace()(input, current);
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(!opened) {
                    return internals.stopFindingResults();
                }
    
                const parsed = input.charAt(0);
                const rest = input.slice(1);
                const location = current.increaseChar(1);
    
                return util.ok({
                    type: 'parse result',
                    subResult: { location: location, text: parsed, type: 'text' },
                    rest,
                    location: location,
                });
            }
    
            const parser = internals.createStringParser(tryParseMultiline, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Multiline code block at ${starting.toString()} does not close`, projectLocation.documentPath);
                }
                const [peaces, leftover] = parsed.value;
                if(leftover.location.compare(starting) === isSame) {
                    return internals.noResultFound();
                }
    
                const result = peaces.map(p => p.text).join(''); //.trim();
                const rest = leftover.remaining;
                
                return util.ok({
                    type: 'parse result',
                    subResult: { location: starting, type: 'text', text: result },
                    rest,
                    location: leftover.location,
                });
            }
    
            return parsed;
        }
    }

    function isInline(): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
            let hasOpened: boolean = false;
    
            function tryParseInLine(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithInlineMarker.test(input)) {
                    opened = !opened;
                    hasOpened = hasOpened || opened;
    
                    const parsed: string = (input.match(doesIt.startWithInlineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        location: current.increaseChar(parsed.length),
                    });
                }
                return internals.noResultFound();
            }

            function tryParseNewLine(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithAnyNewline.test(input)){
                    if(!opened) {
                        return internals.stopFindingResults();
                    }

                    return util.fail(`Inline code block at ${starting.toString()} contains a new line before closing.`, projectLocation.documentPath);
                }

                return internals.noResultFound();
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithNonNewLineWhiteSpace.test(input)) {
                    if(!opened) {
                        return internals.stopFindingResults();
                    }
    
                    const parsed: string = (input.match(doesIt.startWithNonNewLineWhiteSpace) as any)[0];
                    const rest = input.slice(parsed.length);
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        location: current.increaseChar(parsed.length),
                    });
                }
                return internals.noResultFound();
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<string> {
                if(!opened) {
                    return internals.stopFindingResults();
                }
    
                let parsed = input.charAt(0);
                let rest = input.slice(1);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    location: current.increaseChar(1),
                });
            }

            function tryEnd()  {
                if(hasOpened && !opened) {
                    return internals.stopFindingResults();
                }

                return internals.noResultFound();
            }
    
            const parser = internals.createStringParser(tryEnd, tryParseInLine, tryParseNewLine, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Inline code block at ${starting.toString()} does not close`, projectLocation.documentPath);
                }
    
                    const [parts, leftover] = parsed.value;
                if(leftover.location.compare(starting) === isSame) {
                    return internals.noResultFound();
                }
    
                let result = parts.join('');
    
                return util.ok({
                    type: 'parse result',
                    subResult: { type: 'text', location: starting, text: result },
                    rest: leftover.remaining,
                    location: leftover.location,
                });
            }
    
            return parsed;
        }
    }
    
    function isDoculisp(isOpen?: boolean): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let depth = isOpen ? 1 : 0;
            isOpen = false;

            function tryParseDoculispOpen(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithDocuLisp.test(input)) {
                    if(0 < depth) {
                        return util.fail(`Doculisp Block at ${starting.toString()} contains an embedded doculisp block at ${starting.toString()}.`, projectLocation.documentPath);
                    }
    
                    const parsed: string = (input.match(doesIt.startWithDocuLisp) as any)[0];
                    const rest = input.slice(parsed.length);
                    depth++;
    
                    return util.ok({
                        type: 'discard',
                        rest,
                        location: current.increaseChar(parsed.length),
                    });
                }
                return internals.noResultFound();
            }
    
            function tryParseLispOpen(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(depth === 0) return internals.noResultFound();
    
                if(doesIt.startWithOpenLisp.test(input)) {
                    const parsed: string = (input.match(doesIt.startWithOpenLisp) as any)[0];
                    const rest = input.slice(parsed.length);
                    const location = current.increaseChar(parsed.length);
                    depth++;
    
                    return util.ok({
                        type: 'parse result',
                        subResult: { location: location, text: parsed, type: 'text' },
                        rest,
                        location: location,
                    });
                }
    
                return internals.noResultFound();
            }
    
            function tryParseLispClose(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(depth === 0) return internals.noResultFound();
                
                if(doesIt.startsWithCloseLisp.test(input)) {
                    const parsed: string = (input.match(doesIt.startsWithCloseLisp) as any)[0];
                    const rest = input.slice(parsed.length);
                    const location = current.increaseChar(parsed.length);
    
                    const step: IStringParseStepForward = {
                        rest,
                        location: location,
                    };
    
                    depth--;
    
                    if(depth <= 0) {
                        return util.ok(internals.buildStepParse(step, {
                            type: 'discard',
                        }));
                    }
    
                    return util.ok(internals.buildStepParse(step, {
                        type: 'parse result',
                        subResult: { location: location, text: parsed, type: 'text' },
                    }));
                }
                return internals.noResultFound();
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(0 < depth){
                    let parsed = input.charAt(0);
                    let last = parsed;

                    let n = 1;
                    while (last === '\\' && n < input.length) {
                        last = input.charAt(n);
                        n++;
                        parsed += last;
                    }

                    const rest = input.slice(parsed.length);
                    const location = current.increaseChar(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: { location: location, text: parsed, type: 'text' },
                        rest,
                        location: location,
                    });
                }
    
                return internals.stopFindingResults();
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(0 < depth){
                    const tryParseWhiteSpace = isKeptWhiteSpace();
                    return tryParseWhiteSpace(input, current);
                }
                return internals.noResultFound();
            }
    
            const parser = internals.createStringParser(tryParseDoculispOpen, tryParseLispOpen, tryParseLispClose, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
            if(parsed.success) {
                if(0 < depth) {
                    return util.fail(`Doculisp block at ${starting.toString()} is not closed.`, projectLocation.documentPath);
                }
    
                const [parts, leftover] = parsed.value;
                if(leftover.location.compare(starting) === isSame) {
                    return internals.noResultFound();
                }
    
                const step: IStringParseStepForward = {
                    rest: leftover.remaining,
                    location: leftover.location,
                };
    
                if(0 === parts.length) {
                    return util.ok(internals.buildStepParse(step, {
                        type: 'discard'
                    }));
                }
    
                let result = parts.map(p => p.text).join('').trim();
                return util.ok(internals.buildStepParse(step, {
                    type: 'parse result',
                    subResult: { location: starting, type: 'lisp', text: result },
                }));
            }
            return parsed;
        }
    }

    function isComment(): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let opened = false;
            const tryDoculisp = isDoculisp();
    
            const stripWhiteSpace = isDiscardedWhiteSpace();
    
            function tryParseOpenComment(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithOpenComment.test(input)) {
                    const parsed: string = (input.match(doesIt.startWithOpenComment) as any)[0];
                    opened = true;
                    return util.ok({
                        type: 'discard',
                        rest: input.slice(parsed.length),
                        location: current.increaseChar(parsed.length),
                    });
                }
                
                return internals.noResultFound();
            }
    
            function tryParseCloseComment(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithCloseComment.test(input)) {
                    if(opened){
                        const parsed: string = (input.match(doesIt.startWithCloseComment) as any)[0];
                        opened = false;
    
                        return util.ok({
                            type: 'discard',
                            rest: input.slice(parsed.length),
                            location: current.increaseChar(parsed.length),
                        });
                    }
    
                    return internals.stopFindingResults();
                }
                return internals.noResultFound();
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(opened && doesIt.startWithAnyWhiteSpace.test(input)) {
                    return stripWhiteSpace(input, current);
                }
                return internals.noResultFound();
            }
    
            function tryParseDoculisp(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(!opened) {
                    return internals.noResultFound();
                }
    
                return tryDoculisp(input, current);
            }
    
            function tryEndAll(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(!opened) {
                    return internals.stopFindingResults();
                }
    
                return util.ok({
                    type: 'discard',
                    rest: input.slice(1),
                    location: current.increaseChar(1),
                })
            }
    
            const parser = internals.createStringParser(tryParseOpenComment, tryParseCloseComment, tryParseWhiteSpace, tryParseDoculisp, tryEndAll);
            const parsed = parser.parse(toParse, starting);
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Open HTML Comment at ${starting.toString()} but does not close.`, projectLocation.documentPath);
                }

                const [result, leftover] = parsed.value;
                const step : IParseStepForward<string> = {
                    location: leftover.location,
                    rest: leftover.remaining,
                }
    
                if(0 < result.length) {
                    return util.ok(
                        internals.buildStepParse(
                            step,
                            {
                                type: 'parse group result',
                                subResult: result.map(r => { return { type: 'keep', keptValue: r }})
                            }
                        )
                    );
                }
                else if(leftover.location.compare(starting) !== isSame) {
                    return util.ok(
                        internals.buildStepParse(
                            step,
                            {
                                type: 'discard'
                            }
                        )
                    );
                }
    
                return internals.noResultFound();
            }
    
            return parsed;
        }
    }

    function isWord(): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            function tryParseEndParse(input: string, _current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithOpenComment.test(input)) {
                    return internals.stopFindingResults()
                }
                if(doesIt.startWithInlineMarker.test(input)) {
                    return internals.stopFindingResults()
                }
                return internals.noResultFound();
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithNonNewLineWhiteSpace.test(input)) {
                    const parsed: string = (input.match(doesIt.startWithNonNewLineWhiteSpace) as any)[0];
                    const rest = input.slice(parsed.length);
                    const location = current.increaseChar(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: { location: location, text: parsed.replaceAll('\r\n', '\n').replaceAll('\r', '\n'), type: 'text' },
                        rest,
                        location: location,
                    });
                }

                return internals.noResultFound();
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                const startsWithWord = /^\S/;
                if(startsWithWord.test(input)) {
                    const parsed = input.charAt(0);
                    const rest = input.slice(1);
                    const location = current.increaseChar(1);

                    return util.ok({
                        type: 'parse result',
                        subResult: { location: location, text: parsed, type: 'text' },
                        rest,
                        location: location,
                    });
                }
                return internals.noResultFound();
            }
    
            const parser = internals.createStringParser(tryParseEndParse, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                const [parts, leftover] = parsed.value;
                if(leftover.location.compare(starting) === isSame) {
                    return internals.noResultFound();
                }
    
                const result = parts.map(p => p.text).join('');//.trimEnd();
                return util.ok({
                    type: 'parse result',
                    subResult: { type: 'text', text: result, location: starting },
                    rest: leftover.remaining,
                    location: leftover.location,
                });
            }
    
            return parsed;
        }
    }
    
    return {
        isDiscardedWhiteSpace,
        isDiscardedNewline,
        isKeptWhiteSpace,
        isMultiline,
        isInline,
        isDoculisp,
        isComment,
        isWord,
    };
}

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals, util: IUtil): Valid<DocumentParser> {    
    return function (documentText: string, projectLocation: IProjectLocation): Result<DocumentMap> {
        if(projectLocation.documentDepth <= 0) {
            return util.fail(`Document Depth must be a value of 1 or larger.`, projectLocation.documentPath);
        }
        if(projectLocation.documentIndex <= 0) {
            return util.fail(`Document Index must be a value of 1 or larger.`, projectLocation.documentPath);
        }

        const partParsers = getPartParsers(projectLocation, doesIt, parserBuilder, util);
        const documentPath = projectLocation.documentPath;
        const isDoculispFile = path.extname(documentPath) === '.dlisp';
        const toParse: string =
            isDoculispFile ?
            `${documentText})` :
            documentText;

        const parser = 
            isDoculispFile ?
            parserBuilder.createStringParser(partParsers.isDiscardedNewline(), partParsers.isKeptWhiteSpace(), partParsers.isDoculisp(true)) :
            parserBuilder.createStringParser(
                partParsers.isDiscardedNewline(),
                partParsers.isKeptWhiteSpace(),
                partParsers.isMultiline(), 
                partParsers.isInline(), 
                partParsers.isComment(), 
                partParsers.isWord()
            );

        const parsed = parser.parse(toParse, util.toLocation(projectLocation, 1, 1));

        if(parsed.success) {
            const [parts, leftover] = parsed.value;
            if(isDoculispFile && 0 < leftover.remaining.length) {
                const ending = leftover.location.increaseChar(-1);
                return util.fail(`Doculisp block at { line: 1, char: 1 } has something not contained in parenthesis at ${ ending.toString() }.`, documentPath);
            }

            return util.ok(createMap(projectLocation, parts));
        } else {
            return parsed;
        }
    }
}

const registerable: IRegisterable = {
    builder: (searches: Searcher, createParser: IInternals, util: IUtil) => documentParse(searches.searchDocumentFor, createParser, util),
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
};

export {
    registerable as document,
};