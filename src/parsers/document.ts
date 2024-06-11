import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { ILocation, IProjectLocation, IUtil, Result } from "../types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { HandleStringValue, IInternals, IStringParseStepForward, StringStepParseResult } from "../types.internal";

function createMap(projectLocation: IProjectLocation, parts: DocumentPart[]): DocumentMap {
    return {
        projectLocation,
        parts,
    };
}

function id<T>(value: T): T {
    return value;
}

type ParesBuilder = {
    isDiscardedWhiteSpace(): HandleStringValue<DocumentPart>;
    isKeptWhiteSpace(): HandleStringValue<string>;
    isMultiline() : HandleStringValue<DocumentPart>;
    isInline(): HandleStringValue<DocumentPart>;
    isDoculisp(isOpen?: boolean): HandleStringValue<DocumentPart>;
    isComment(): HandleStringValue<DocumentPart>;
    isWord(): HandleStringValue<DocumentPart>;
};

function getPartParsers(projectLocation: IProjectLocation, doesIt: IDocumentSearches, internals: IInternals, util: IUtil): ParesBuilder {
    function isStopParsingWhiteSpace(input: string, _current: ILocation): Result<'stop' | false> {
        const regex = /\S+/;
        if(regex.test(input)) {
            return util.ok('stop');
        }
        return util.ok(false);
    }

    function doesItStartWithDiscarded(startsWith: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleStringValue<DocumentPart> {
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            if(startsWith.test(input)) {
                const found: string = (input.match(startsWith) as any)[0];
                return util.ok({
                    type: 'discard',
                    rest: input.slice(found.length),
                    line: lineIncrement(current.line),
                    char: charIncrement(current.char, found),
                });
            }
            return util.ok(false);
        }
    }

    function doesItStartWithKeep(startsWith: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleStringValue<string> {
        return function (input:string, current: ILocation): StringStepParseResult<string> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line: lineIncrement(current.line),
                    char: charIncrement(current.char, parsed),
                });
            }
            return util.ok(false);
        }
    }

    function isDiscardedWhiteSpace(): HandleStringValue<DocumentPart> {
        const createParser = internals.createStringParser<DocumentPart>;
        return function (input: string, current: ILocation): StringStepParseResult<DocumentPart> {
            const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
            const isLinux = doesItStartWithDiscarded(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
            const isMac = doesItStartWithDiscarded(doesIt.startWithMacsNewline, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithDiscarded(doesIt.startWithWhiteSpace, l => l, (c, f) => c + f.length);
    
            const whiteSpaceParser = createParser(isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace);
            const parsed = whiteSpaceParser.parse(input, current);
            if(parsed.success) {
                const [_, leftovers] = parsed.value;
                if(leftovers.remaining === input) {
                    return util.ok(false);
                } else {
                    return util.ok({
                        type: 'discard',
                        rest: leftovers.remaining,
                        line: leftovers.line,
                        char: leftovers.char,
                    });
                }
            } else {
                return parsed;
            }
        }
    }

    function isKeptWhiteSpace(): HandleStringValue<string> {
        return function (input: string, current: ILocation): StringStepParseResult<string> {
            const isWindows = doesItStartWithKeep(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
            const isLinux = doesItStartWithKeep(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
            const isMac = doesItStartWithKeep(doesIt.startWithMacsNewline, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithKeep(doesIt.startWithWhiteSpace, id, (c, f) => c + f.length);
    
            const parser = internals.createStringParser(isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace)
            const parsed = parser.parse(input, current);
            if(parsed.success) {
                const [result, leftover] = parsed.value;
                if(leftover.line === current.line && leftover.char === current.char) {
                    return util.ok(false);
                }
    
                let step: IStringParseStepForward = {
                    rest: leftover.remaining,
                    line: leftover.line,
                    char: leftover.char,
                }
    
                if(0 === result.length) {
                    return util.ok(internals.buildStepParse(step, {
                        type: 'discard',
                    }));
                }
    
                if(1 === result.length) {
                    return util.ok(internals.buildStepParse(step, {
                        type: 'parse result',
                        subResult: result[0] as string
                    }));
                }
    
                return util.ok(internals.buildStepParse(step, {
                    type: 'parse group result',
                    subResult: result.map(r => { return { type:'keep', keptValue: r }; }),
                }));
            }
    
            return parsed;
        }
    }

    function isMultiline() : HandleStringValue<DocumentPart> {
        return function(toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
    
            function tryParseMultiline(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithMultilineMarker.test(input)) {
                    opened = !opened;
    
                    const parsed: string = (input.match(doesIt.startWithMultilineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: current.char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            const tryParseWhiteSpace = isKeptWhiteSpace();
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<string> {
                if(!opened) {
                    return util.ok('stop');
                }
    
                const parsed = input.charAt(0);
                const rest = input.slice(1);
    
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line: current.line,
                    char: current.char + 1,
                });
            }
    
            const parser = internals.createStringParser(tryParseMultiline, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Multiline code block at ${starting.toString()} does not close`, projectLocation.documentPath);
                }
                const [peaces, leftover] = parsed.value;
                if(leftover.line === starting.line && leftover.char === starting.char) {
                    return util.ok(false);
                }
    
                const result = peaces.join('').trim();
                const rest = leftover.remaining;
                
                return util.ok({
                    type: 'parse result',
                    subResult: { location: starting, type: 'text', text: result },
                    rest,
                    line: leftover.line,
                    char: leftover.char,
                });
            }
    
            return parsed;
        }
    }

    function isInline(): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
    
            function tryParseInLine(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithInlineMarker.test(input)) {
                    opened = !opened;
    
                    const parsed: string = (input.match(doesIt.startWithInlineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: current.char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithWhiteSpace.test(input)) {
                    let doesItStartWithNewLine = /^\r|\n/;
                    if(doesItStartWithNewLine.test(input)) {
                        return util.fail(`Inline code block at ${starting.toString()} contains a new line before closing.`, projectLocation.documentPath);
                    }
    
                    const parsed: string = (input.match(doesIt.startWithWhiteSpace) as any)[0];
                    const rest = input.slice(parsed.length);
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: current.char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<string> {
                if(!opened) {
                    return util.ok('stop');
                }
    
                let parsed = input.charAt(0);
                let rest = input.slice(1);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line: current.line,
                    char: current.char + 1,
                });
            }
    
            const parser = internals.createStringParser(tryParseInLine, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Inline code block at ${starting.toString()} does not close`, projectLocation.documentPath);
                }
    
                    const [parts, leftover] = parsed.value;
                if(leftover.line === starting.line && leftover.char === starting.char) {
                    return util.ok(false);
                }
    
                let result = parts.join('');
    
                return util.ok({
                    type: 'parse result',
                    subResult: { type: 'text', location: starting, text: result },
                    rest: leftover.remaining,
                    line: leftover.line,
                    char: leftover.char,
                });
            }
    
            return parsed;
        }
    }
    
    function isDoculisp(isOpen?: boolean): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            function updateChar(char: number, found: string): number {
                return char + found.length;
            }
    
            let depth = isOpen ? 1 : 0;
            isOpen = false;
            function tryParseDoculispOpen(input: string, current: ILocation): StringStepParseResult<string> {
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
                        line: current.line,
                        char: updateChar(current.char, parsed),
                    });
                }
                return util.ok(false);
            }
    
            function tryParseLispOpen(input: string, current: ILocation): StringStepParseResult<string> {
                if(depth === 0) return util.ok(false);
    
                if(doesIt.startWithOpenLisp.test(input)) {
                    const parsed: string = (input.match(doesIt.startWithOpenLisp) as any)[0];
                    const rest = input.slice(parsed.length);
                    depth++;
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: updateChar(current.char, parsed),
                    });
                }
    
                return util.ok(false);
            }
    
            function tryParseLispClose(input: string, current: ILocation): StringStepParseResult<string> {
                if(depth === 0) return util.ok(false);
                
                if(doesIt.startsWithCloseLisp.test(input)) {
                    const parsed: string = (input.match(doesIt.startsWithCloseLisp) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    const step: IStringParseStepForward = {
                        rest,
                        line: current.line,
                        char: updateChar(current.char, parsed),
                    };
    
                    depth--;
    
                    if(depth <= 0) {
                        return util.ok(internals.buildStepParse(step, {
                            type: 'discard',
                        }));
                    }
    
                    return util.ok(internals.buildStepParse(step, {
                        type: 'parse result',
                        subResult: parsed,
                    }));
                }
                return util.ok(false);
            }
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<string> {
                if(0 < depth){
                    const parsed = input.charAt(0);
                    const rest = input.slice(1);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: updateChar(current.char, parsed),
                    });
                }
    
                return util.ok('stop');
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<string> {
                if(0 < depth){
                    const tryParseWhiteSpace = isKeptWhiteSpace();
                    return tryParseWhiteSpace(input, current);
                }
                return util.ok(false);
            }
    
            const parser = internals.createStringParser(tryParseDoculispOpen, tryParseLispOpen, tryParseLispClose, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
            if(parsed.success) {
                if(0 < depth) {
                    return util.fail(`Doculisp block at ${starting.toString()} is not closed.`, projectLocation.documentPath);
                }
    
                const [parts, leftover] = parsed.value;
                if(leftover.line === starting.line && leftover.char === starting.char) {
                    return util.ok(false);
                }
    
                const step: IStringParseStepForward = {
                    rest: leftover.remaining,
                    line: leftover.line,
                    char: leftover.char,
                };
    
                if(0 === parts.length) {
                    return util.ok(internals.buildStepParse(step, {
                        type: 'discard'
                    }));
                }
    
                let result = parts.join('').trim();
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
                        line: current.line,
                        char: current.char + parsed.length,
                    });
                }
                
                return util.ok(false);
            }
    
            function tryParseCloseComment(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(doesIt.startWithCloseComment.test(input)) {
                    if(opened){
                        const parsed: string = (input.match(doesIt.startWithCloseComment) as any)[0];
                        opened = false;
    
                        return util.ok({
                            type: 'discard',
                            rest: input.slice(parsed.length),
                            line: current.line,
                            char: current.char + parsed.length,
                        });
                    }
    
                    return util.ok('stop');
                }
                return util.ok(false);
            }
    
            function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(opened && doesIt.startWithWhiteSpace.test(input)) {
                    return stripWhiteSpace(input, current);
                }
                return util.ok(false);
            }
    
            function tryParseDoculisp(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(!opened) {
                    return util.ok(false);
                }
    
                return tryDoculisp(input, current);
            }
    
            function tryEndAll(input: string, current: ILocation): StringStepParseResult<DocumentPart> {
                if(!opened) {
                    return util.ok('stop');
                }
    
                return util.ok({
                    type: 'discard',
                    rest: input.slice(1),
                    line: current.line,
                    char: current.char + 1,
                })
            }
    
            const parser = internals.createStringParser(tryParseOpenComment, tryParseCloseComment, tryParseWhiteSpace, tryParseDoculisp, tryEndAll);
            const parsed = parser.parse(toParse, starting);
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Open HTML Comment at ${starting.toString()} but does not close.`, projectLocation.documentPath);
                }
    
                const [result, leftover] = parsed.value;
                if(0 < result.length) {
                    return util.ok({
                        type: 'parse group result',
                        subResult: result.map(r => { return { type: 'keep', keptValue: r }}),
                        rest: leftover.remaining,
                        line: leftover.line,
                        char: leftover.char,
                    });
                }
                else if(leftover.line !== starting.line || leftover.char !== starting.char) {
                    return util.ok({
                        type: 'discard',
                        rest: leftover.remaining,
                        line: leftover.line,
                        char: leftover.char,
                    });
                }
    
                return util.ok(false);
            }
    
            return parsed;
        }
    }

    function isWord(): HandleStringValue<DocumentPart> {
        return function (toParse: string, starting: ILocation): StringStepParseResult<DocumentPart> {
            function tryParseEndParse(input: string, _current: ILocation): StringStepParseResult<string> {
                if(doesIt.startWithOpenComment.test(input)) {
                    return util.ok('stop')
                }
                if(doesIt.startWithInlineMarker.test(input)) {
                    return util.ok('stop')
                }
                return util.ok(false);
            }
    
            const tryParseWhiteSpace = isKeptWhiteSpace();
    
            function tryParseWord(input: string, current: ILocation): StringStepParseResult<string> {
                const startsWithWord = /^\S/;
                if(startsWithWord.test(input)) {
                    const parsed = input.charAt(0);
                    const rest = input.slice(1);
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line: current.line,
                        char: current.char + 1,
                    });
                }
                return util.ok(false);
            }
    
            const parser = internals.createStringParser(tryParseEndParse, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, starting);
    
            if(parsed.success) {
                const [parts, leftover] = parsed.value;
                if(leftover.line === starting.line && leftover.char === starting.char) {
                    return util.ok(false);
                }
    
                const result = parts.join('').trim();
                return util.ok({
                    type: 'parse result',
                    subResult: { type: 'text', text: result, location: starting },
                    rest: leftover.remaining,
                    line: leftover.line,
                    char: leftover.char,
                });
            }
    
            return parsed;
        }
    }
    
    return {
        isDiscardedWhiteSpace,
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
        const partParsers = getPartParsers(projectLocation, doesIt, parserBuilder, util);
        const documentPath = projectLocation.documentPath;
        const isDoculispFile = path.extname(documentPath) === '.dlisp';
        const toParse: string =
            isDoculispFile ?
            `${documentText})` :
            documentText;

        const parser = 
            isDoculispFile ?
            parserBuilder.createStringParser(partParsers.isDoculisp(true)) :
            parserBuilder.createStringParser(
                partParsers.isDiscardedWhiteSpace(), 
                partParsers.isMultiline(), 
                partParsers.isInline(), 
                partParsers.isComment(), 
                partParsers.isWord()
            );

        const parsed = parser.parse(toParse, util.toLocation(projectLocation, 1, 1));

        if(parsed.success) {
            const [parts, leftover] = parsed.value;
            if(isDoculispFile && 0 < leftover.remaining.length) {
                const ending = util.toLocation(projectLocation, leftover.line, leftover.char - 1);
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
    dependencies: ['searches', 'parser', 'util']
};

export {
    registerable as document,
};