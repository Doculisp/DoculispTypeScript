import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { IUtil, Result, ok } from "../types.general";
import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { HandleStringValue, IInternals, IStringParseStepForward, StringStepParseResult } from "../types.internal";

function createMap(documentPath: string, parts: DocumentPart[]): DocumentMap {
    return {
        documentPath,
        parts,
    };
}

function id<T>(value: T): T {
    return value;
}

function isStopParsingWhiteSpace(input: string, _line: number, _char: number): Result<'stop' | false> {
    const regex = /\S+/;
    if(regex.test(input)) {
        return ok('stop');
    }
    return ok(false);
}

type ParesBuilder = {
    isDiscardedWhiteSpace(): HandleStringValue<DocumentPart>;
    isKeptWhiteSpace(): HandleStringValue<string>;
    isMultiline() : HandleStringValue<DocumentPart>;
    isInline(): HandleStringValue<DocumentPart>;
};

function getPartParsers(documentPath: string, doesIt: IDocumentSearches, internals: IInternals, util: IUtil): ParesBuilder {
    function doesItStartWithDiscarded(startsWith: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleStringValue<DocumentPart> {
        return function (input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(startsWith.test(input)) {
                const found: string = (input.match(startsWith) as any)[0];
                return util.ok({
                    type: 'discard',
                    rest: input.slice(found.length),
                    line: lineIncrement(line),
                    char: charIncrement(char, found),
                });
            }
            return util.ok(false);
        }
    }

    function doesItStartWithKeep(startsWith: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleStringValue<string> {
        return function (input:string, line: number, char: number): StringStepParseResult<string> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line: lineIncrement(line),
                    char: charIncrement(char, parsed),
                });
            }
            return util.ok(false);
        }
    }

    function isDiscardedWhiteSpace(): HandleStringValue<DocumentPart> {
        const createParser = internals.createStringParser<DocumentPart>;
        return function (input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
            const isLinux = doesItStartWithDiscarded(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
            const isMac = doesItStartWithDiscarded(doesIt.startWithMacsNewline, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithDiscarded(doesIt.startWithWhiteSpace, l => l, (c, f) => c + f.length);
    
            const whiteSpaceParser = createParser(isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace);
            const parsed = whiteSpaceParser.parse(input, line, char);
            if(parsed.success) {
                const [_, leftovers] = parsed.value;
                if(leftovers.remaining === input) {
                    return util.ok(false);
                } else {
                    return util.ok({
                        type: 'discard',
                        rest: leftovers.remaining,
                        line: leftovers.location.line,
                        char: leftovers.location.char,
                    });
                }
            } else {
                return parsed;
            }
        }
    }

    function isKeptWhiteSpace(): HandleStringValue<string> {
        return function (input: string, line: number, char: number): StringStepParseResult<string> {
            const isWindows = doesItStartWithKeep(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
            const isLinux = doesItStartWithKeep(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
            const isMac = doesItStartWithKeep(doesIt.startWithMacsNewline, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithKeep(doesIt.startWithWhiteSpace, id, (c, f) => c + f.length);
    
            const parser = internals.createStringParser(isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace)
            const parsed = parser.parse(input, line, char);
            if(parsed.success) {
                const [result, leftover] = parsed.value;
                if(leftover.location.line === line && leftover.location.char === char) {
                    return util.ok(false);
                }
    
                let step: IStringParseStepForward = {
                    rest: leftover.remaining,
                    line: leftover.location.line,
                    char: leftover.location.char,
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
        return function(toParse: string, startingLine: number, startingChar: number): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
    
            function tryParseMultiline(input: string, line: number, char: number): StringStepParseResult<string> {
                if(doesIt.startWithMultilineMarker.test(input)) {
                    opened = !opened;
    
                    const parsed: string = (input.match(doesIt.startWithMultilineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            const tryParseWhiteSpace = isKeptWhiteSpace();
    
            function tryParseWord(input: string, line: number, char: number): StringStepParseResult<string> {
                if(!opened) {
                    return util.ok('stop');
                }
    
                const parsed = input.charAt(0);
                const rest = input.slice(1);
    
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: char + 1,
                });
            }
    
            const parser = internals.createStringParser(tryParseMultiline, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, startingLine, startingChar);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Multiline code block at { line: ${startingLine}, char: ${startingChar} } does not close`, documentPath);
                }
                const [peaces, leftover] = parsed.value;
                if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                    return util.ok(false);
                }
    
                const result = peaces.join('').trim();
                const rest = leftover.remaining;
                
                return util.ok({
                    type: 'parse result',
                    subResult: { location: { line: startingLine, char: startingChar }, type: 'text', text: result },
                    rest,
                    line: leftover.location.line,
                    char: leftover.location.char,
                });
            }
    
            return parsed;
        }
    }

    function isInline(): HandleStringValue<DocumentPart> {
        return function (toParse: string, startingLine: number, startingChar: number): StringStepParseResult<DocumentPart> {
            let opened: boolean = false;
    
            function tryParseInLine(input: string, line: number, char: number): StringStepParseResult<string> {
                if(doesIt.startWithInlineMarker.test(input)) {
                    opened = !opened;
    
                    const parsed: string = (input.match(doesIt.startWithInlineMarker) as any)[0];
                    const rest = input.slice(parsed.length);
    
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            function tryParseWhiteSpace(input: string, line: number, char: number): StringStepParseResult<string> {
                if(doesIt.startWithWhiteSpace.test(input)) {
                    let doesItStartWithNewLine = /^\r|\n/;
                    if(doesItStartWithNewLine.test(input)) {
                        return util.fail(`Inline code block at { line: ${startingLine}, char: ${startingChar} } contains a new line before closing.`, documentPath);
                    }
    
                    const parsed: string = (input.match(doesIt.startWithWhiteSpace) as any)[0];
                    const rest = input.slice(parsed.length);
                    return util.ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return util.ok(false);
            }
    
            function tryParseWord(input: string, line: number, char: number): StringStepParseResult<string> {
                if(!opened) {
                    return util.ok('stop');
                }
    
                let parsed = input.charAt(0);
                let rest = input.slice(1);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: char + 1,
                });
            }
    
            const parser = internals.createStringParser(tryParseInLine, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, startingLine, startingChar);
    
            if(parsed.success) {
                if(opened) {
                    return util.fail(`Inline code block at { line: ${startingLine}, char: ${startingChar} } does not close`, documentPath);
                }
    
                    const [parts, leftover] = parsed.value;
                if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                    return util.ok(false);
                }
    
                let result = parts.join('');
    
                return util.ok({
                    type: 'parse result',
                    subResult: { type: 'text', location: { line: startingLine, char: startingChar }, text: result },
                    rest: leftover.remaining,
                    line: leftover.location.line,
                    char: leftover.location.char,
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
    };
}

function isDoculisp(documentPath: string, doesIt: IDocumentSearches, internals: IInternals, util: IUtil, isOpen?: boolean): HandleStringValue<DocumentPart> {
    const builder = getPartParsers(documentPath, doesIt, internals, util);
    return function (toParse: string, startLine: number, startChar: number): StringStepParseResult<DocumentPart> {
        function updateChar(char: number, found: string): number {
            return char + found.length;
        }

        let depth = isOpen ? 1 : 0;
        isOpen = false;
        function tryParseDoculispOpen(input: string, line: number, char: number): StringStepParseResult<string> {
            if(doesIt.startWithDocuLisp.test(input)) {
                if(0 < depth) {
                    return util.fail(`Doculisp Block at { line: ${startLine}, char: ${startChar} } contains an embedded doculisp block at { line: ${line}, char: ${char} }.`, documentPath);
                }

                const parsed: string = (input.match(doesIt.startWithDocuLisp) as any)[0];
                const rest = input.slice(parsed.length);
                depth++;

                return util.ok({
                    type: 'discard',
                    rest,
                    line,
                    char: updateChar(char, parsed),
                });
            }
            return util.ok(false);
        }

        function tryParseLispOpen(input: string, line: number, char: number): StringStepParseResult<string> {
            if(depth === 0) return util.ok(false);

            if(doesIt.startWithOpenLisp.test(input)) {
                const parsed: string = (input.match(doesIt.startWithOpenLisp) as any)[0];
                const rest = input.slice(parsed.length);
                depth++;

                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: updateChar(char, parsed),
                });
            }

            return util.ok(false);
        }

        function tryParseLispClose(input: string, line: number, char: number): StringStepParseResult<string> {
            if(depth === 0) return util.ok(false);
            
            if(doesIt.startsWithCloseLisp.test(input)) {
                const parsed: string = (input.match(doesIt.startsWithCloseLisp) as any)[0];
                const rest = input.slice(parsed.length);

                const step: IStringParseStepForward = {
                    rest,
                    line,
                    char: updateChar(char, parsed),
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

        function tryParseWord(input: string, line: number, char: number): StringStepParseResult<string> {
            if(0 < depth){
                const parsed = input.charAt(0);
                const rest = input.slice(1);

                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: updateChar(char, parsed),
                });
            }

            return util.ok('stop');
        }

        function tryParseWhiteSpace(input: string, line: number, char: number): StringStepParseResult<string> {
            if(0 < depth){
                const tryParseWhiteSpace = builder.isKeptWhiteSpace();
                return tryParseWhiteSpace(input, line, char);
            }
            return util.ok(false);
        }

        const parser = internals.createStringParser(tryParseDoculispOpen, tryParseLispOpen, tryParseLispClose, tryParseWhiteSpace, tryParseWord);
        const parsed = parser.parse(toParse, startLine, startChar);
        if(parsed.success) {
            if(0 < depth) {
                return util.fail(`Doculisp block at { line: ${startLine}, char: ${startChar} } is not closed.`, documentPath);
            }

            const [parts, leftover] = parsed.value;
            if(leftover.location.line === startLine && leftover.location.char === startChar) {
                return util.ok(false);
            }

            const step: IStringParseStepForward = {
                rest: leftover.remaining,
                line: leftover.location.line,
                char: leftover.location.char,
            };

            if(0 === parts.length) {
                return util.ok(internals.buildStepParse(step, {
                    type: 'discard'
                }));
            }

            let result = parts.join('').trim();
            return util.ok(internals.buildStepParse(step, {
                type: 'parse result',
                subResult: { location: { line: startLine, char: startChar }, type: 'lisp', text: result },
            }));
        }
        return parsed;
    }
}

function isComment(documentPath: string, doesIt: IDocumentSearches, parserBuilder: IInternals, util: IUtil): HandleStringValue<DocumentPart> {
    const builder = getPartParsers(documentPath, doesIt, parserBuilder, util)
    return function (toParse: string, startingLine: number, startingChar: number): StringStepParseResult<DocumentPart> {
        let opened = false;
        const tryDoculisp = isDoculisp(documentPath, doesIt, parserBuilder, util);

        const stripWhiteSpace = builder.isDiscardedWhiteSpace();

        function tryParseOpenComment(input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(doesIt.startWithOpenComment.test(input)) {
                const parsed: string = (input.match(doesIt.startWithOpenComment) as any)[0];
                opened = true;
                return util.ok({
                    type: 'discard',
                    rest: input.slice(parsed.length),
                    line,
                    char: char + parsed.length,
                });
            }
            
            return util.ok(false);
        }

        function tryParseCloseComment(input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(doesIt.startWithCloseComment.test(input)) {
                if(opened){
                    const parsed: string = (input.match(doesIt.startWithCloseComment) as any)[0];
                    opened = false;

                    return util.ok({
                        type: 'discard',
                        rest: input.slice(parsed.length),
                        line,
                        char: char + parsed.length,
                    });
                }

                return util.ok('stop');
            }
            return util.ok(false);
        }

        function tryParseWhiteSpace(input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(opened && doesIt.startWithWhiteSpace.test(input)) {
                return stripWhiteSpace(input, line, char);
            }
            return util.ok(false);
        }

        function tryParseDoculisp(input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(!opened) {
                return util.ok(false);
            }

            return tryDoculisp(input, line, char);
        }

        function tryEndAll(input: string, line: number, char: number): StringStepParseResult<DocumentPart> {
            if(!opened) {
                return util.ok('stop');
            }

            return util.ok({
                type: 'discard',
                rest: input.slice(1),
                line,
                char: char + 1,
            })
        }

        const parser = parserBuilder.createStringParser(tryParseOpenComment, tryParseCloseComment, tryParseWhiteSpace, tryParseDoculisp, tryEndAll);
        const parsed = parser.parse(toParse, startingLine, startingChar);
        if(parsed.success) {
            if(opened) {
                return util.fail(`Open HTML Comment at { line: ${startingLine}, char: ${startingChar} } but does not close.`, documentPath);
            }

            const [result, leftover] = parsed.value;
            if(0 < result.length) {
                return util.ok({
                    type: 'parse group result',
                    subResult: result.map(r => { return { type: 'keep', keptValue: r }}),
                    rest: leftover.remaining,
                    line: leftover.location.line,
                    char: leftover.location.char,
                });
            }
            else if(leftover.location.line !== startingLine || leftover.location.char !== startingChar) {
                return util.ok({
                    type: 'discard',
                    rest: leftover.remaining,
                    line: leftover.location.line,
                    char: leftover.location.char,
                });
            }

            return util.ok(false);
        }

        return parsed;
    }
}

function isWord(doesIt: IDocumentSearches, internals: IInternals, util: IUtil) {
    const builder = getPartParsers('', doesIt, internals, util);
    return function (toParse: string, startingLine: number, startingChar: number): StringStepParseResult<DocumentPart> {
        function tryParseEndParse(input: string, _line: number, _char: number): StringStepParseResult<string> {
            if(doesIt.startWithOpenComment.test(input)) {
                return util.ok('stop')
            }
            if(doesIt.startWithInlineMarker.test(input)) {
                return util.ok('stop')
            }
            return util.ok(false);
        }

        const tryParseWhiteSpace = builder.isKeptWhiteSpace();

        function tryParseWord(input: string, line: number, char: number): StringStepParseResult<string> {
            const startsWithWord = /^\S/;
            if(startsWithWord.test(input)) {
                const parsed = input.charAt(0);
                const rest = input.slice(1);
                return util.ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: char + 1,
                });
            }
            return util.ok(false);
        }

        const parser = internals.createStringParser(tryParseEndParse, tryParseWhiteSpace, tryParseWord);
        const parsed = parser.parse(toParse, startingLine, startingChar);

        if(parsed.success) {
            const [parts, leftover] = parsed.value;
            if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                return util.ok(false);
            }

            const result = parts.join('').trim();
            return util.ok({
                type: 'parse result',
                subResult: { type: 'text', text: result, location: { line: startingLine, char: startingChar } },
                rest: leftover.remaining,
                line: leftover.location.line,
                char: leftover.location.char,
            });
        }

        return parsed;
    }
}

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals, util: IUtil): Valid<DocumentParser> {    
    return function (documentText: string, documentPath: string): Result<DocumentMap> {
        const partParsers = getPartParsers(documentPath, doesIt, parserBuilder, util);
        const isDoculispFile = path.extname(documentPath) === '.dlisp';
        const toParse: string =
            isDoculispFile ?
            `${documentText})` :
            documentText;

        const parser = 
            isDoculispFile ?
            parserBuilder.createStringParser(isDoculisp(documentPath, doesIt, parserBuilder, util, true)) :
            parserBuilder.createStringParser(partParsers.isDiscardedWhiteSpace(), partParsers.isMultiline(), partParsers.isInline(), isComment(documentPath, doesIt, parserBuilder, util), isWord(doesIt, parserBuilder, util));

        const parsed = parser.parse(toParse, 1, 1);

        if(parsed.success) {
            const [parts, leftover] = parsed.value;
            if(isDoculispFile && 0 < leftover.remaining.length) {
                return util.fail(`Doculisp block at { line: 1, char: 1 } has something not contained in parenthesis at { line: ${leftover.location.line}, char: ${leftover.location.char - 1} }.`, documentPath);
            }

            return util.ok(createMap(documentPath, parts));
        } else {
            return parsed;
        }
    }
}

const registerable: IRegisterable = {
    builder: (searches: Searcher, createParser: IInternals, util: IUtil) => documentParse(searches.searchDocumentFor, createParser, util),
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'parser', 'general']
};

export {
    registerable as document,
};