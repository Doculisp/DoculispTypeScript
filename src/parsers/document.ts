import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { Result, fail, ok } from "../types.general";
// import * as path from 'node:path';
import { IDocumentSearches, IWhiteSpaceSearches, Searcher } from "../types.textHelpers";
import { HandleValue, IInternals, IParseStepForward, StepParseResult } from "../types.internal";

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

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals): Valid<DocumentParser> {
    function doesItStartWithDiscarded(startsWith: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleValue<DocumentPart> {
        return function (input: string, line: number, char: number): StepParseResult<DocumentPart> {
            if(startsWith.test(input)) {
                const found: string = (input.match(startsWith) as any)[0];
                return ok({
                    type: 'discard',
                    rest: input.slice(found.length),
                    line: lineIncrement(line),
                    char: charIncrement(char, found),
                });
            }
            return ok(false);
        }
    }

    function isDiscardedWhiteSpace(documentPath: string): HandleValue<DocumentPart> {
        return function isDiscardedWhiteSpace(input: string, line: number, char: number): StepParseResult<DocumentPart> {
            const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
            const isLinux = doesItStartWithDiscarded(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
            const isMac = doesItStartWithDiscarded(doesIt.startWithMacsNewline, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithDiscarded(doesIt.startWithWhiteSpace, l => l, (c, f) => c + f.length);

            const whiteSpaceParser = parserBuilder.createParser(documentPath, isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace);
            const parsed = whiteSpaceParser.parse(input, line, char);
            if(parsed.success) {
                const [_, leftovers] = parsed.value;
                if(leftovers.remaining === input) {
                    return ok(false);
                } else {
                    return ok({
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

    function doesItStartWithKeep<T>(startsWith: RegExp, map: (parsed: string) => T, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleValue<T> {
        return function (input:string, line: number, char: number): StepParseResult<T> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);
                return ok({
                    type: 'parse result',
                    subResult: map(parsed),
                    rest,
                    line: lineIncrement(line),
                    char: charIncrement(char, parsed),
                });
            }
            return ok(false);
        }
    }

    function isKeptWhiteSpace<T>(documentPath: string, map: (value: string) => T): HandleValue<T> {
        const it = doesIt as IWhiteSpaceSearches;
        return function (input: string, line: number, char: number): StepParseResult<T> {
            const isWindows = doesItStartWithKeep(it.startWithWindowsNewline, map, l => l + 1, () => 1);
            const isLinux = doesItStartWithKeep(it.startWithLinuxNewline, map, l => l + 1, () => 1);
            const isMac = doesItStartWithKeep(it.startWithMacsNewline, map, l => l + 1, () => 1);
            const isWhiteSpace = doesItStartWithKeep(it.startWithWhiteSpace, map, id, (c, f) => c + f.length);

            const parser = parserBuilder.createParser(documentPath, isWindows, isLinux, isMac, isWhiteSpace, isStopParsingWhiteSpace)
            const parsed = parser.parse(input, line, char);
            if(parsed.success) {
                const [result, leftover] = parsed.value;
                if(leftover.location.line === line && leftover.location.char === char) {
                    return ok(false);
                }

                let step: IParseStepForward = {
                    rest: leftover.remaining,
                    line: leftover.location.line,
                    char: leftover.location.char,
                }

                if(0 === result.length) {
                    return ok(parserBuilder.buildStepParse(step, {
                        type: 'discard',
                    }));
                }

                if(1 === result.length) {
                    return ok(parserBuilder.buildStepParse(step, {
                        type: 'parse result',
                        subResult: result[0] as T
                    }));
                }

                return ok(parserBuilder.buildStepParse(step, {
                    type: 'parse group result',
                    subResult: result.map(r => { return { type:'keep', keptValue: r }; }),
                }));
            }

            return parsed;
        }
    }

    function isMultiline(documentPath: string) : HandleValue<DocumentPart> {
        return function(toParse: string, startingLine: number, startingChar: number): StepParseResult<DocumentPart> {
            let state: 'unopened' | 'open' | 'close' = 'unopened';

            function tryParseMultiline(input: string, line: number, char: number): StepParseResult<string> {
                if(doesIt.startWithMultilineMarker.test(input)) {
                    if(state === 'unopened' || state === 'close') {
                        state = 'open';
                    } else if (state === 'open') {
                        state = 'close';
                    }

                    const parsed: string = (input.match(doesIt.startWithMultilineMarker) as any)[0];
                    const rest = input.slice(parsed.length);

                    return ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return ok(false);
            }

            const tryParseWhiteSpace = isKeptWhiteSpace(documentPath, id);

            function tryParseWord(input: string, line: number, char: number): StepParseResult<string> {
                if(state === 'close' || state === 'unopened') {
                    return ok('stop');
                }

                const parsed = input.charAt(0);
                const rest = input.slice(1);

                return ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: char + 1,
                });
            }

            const parser = parserBuilder.createParser(documentPath, tryParseMultiline, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, startingLine, startingChar);

            if(parsed.success) {
                const [peaces, leftover] = parsed.value;
                if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                    return ok(false);
                }

                const result = peaces.join('').trim();
                const rest = leftover.remaining;
                
                return ok({
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

    function isInline(documentPath: string): HandleValue<DocumentPart> {
        return function (toParse: string, startingLine: number, startingChar: number): StepParseResult<DocumentPart> {
            let state: 'unopened' | 'open' | 'close' = 'unopened';

            function tryParseInLine(input: string, line: number, char: number): StepParseResult<string> {
                if(doesIt.startWithInlineMarker.test(input)) {
                    if(state === 'unopened' || state === 'close') {
                        state = 'open';
                    } else if(state === 'open') {
                        state = 'close'
                    }

                    const parsed: string = (input.match(doesIt.startWithInlineMarker) as any)[0];
                    const rest = input.slice(parsed.length);

                    return ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return ok(false);
            }

            function tryParseWhiteSpace(input: string, line: number, char: number): StepParseResult<string> {
                if(doesIt.startWithWhiteSpace.test(input)) {
                    let doesItStartWithNewLine = /^\r|\n/;
                    if(doesItStartWithNewLine.test(input)) {
                        return fail(`Inline code block spans multiple lines at { line: ${line}, char: ${char} }`, documentPath);
                    }

                    const parsed: string = (input.match(doesIt.startWithWhiteSpace) as any)[0];
                    const rest = input.slice(parsed.length);
                    return ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + parsed.length,
                    });
                }
                return ok(false);
            }

            function tryParseWord(input: string, line: number, char: number): StepParseResult<string> {
                if(state === 'close' || state === 'unopened') {
                    return ok('stop');
                }

                let parsed = input.charAt(0);
                let rest = input.slice(1);
                return ok({
                    type: 'parse result',
                    subResult: parsed,
                    rest,
                    line,
                    char: char + 1,
                });
            }

            const parser = parserBuilder.createParser(documentPath, tryParseInLine, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, startingLine, startingChar);

            if(parsed.success) {
                const [parts, leftover] = parsed.value;
                if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                    return ok(false);
                }

                let result = parts.join('');

                return ok({
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

    function isComment(documentPath: string) {
        return function isComment(toParse: string, startingLine: number, startingChar: number): StepParseResult<DocumentPart> {
            let opened = false;

            const stripWhiteSpace = isDiscardedWhiteSpace(documentPath);

            function tryParseOpenComment(input: string, line: number, char: number): StepParseResult<DocumentPart> {
                if(doesIt.startWithOpenComment.test(input)) {
                    const parsed: string = (input.match(doesIt.startWithOpenComment) as any)[0];
                    opened = true;
                    return ok({
                        type: 'discard',
                        rest: input.slice(parsed.length),
                        line,
                        char: char + parsed.length,
                    });
                }
                
                return ok(false);
            }

            function tryParseCloseComment(input: string, line: number, char: number): StepParseResult<DocumentPart> {
                if(doesIt.startWithCloseComment.test(input)) {
                    if(opened){
                        const parsed: string = (input.match(doesIt.startWithCloseComment) as any)[0];
                        opened = false;

                        return ok({
                            type: 'discard',
                            rest: input.slice(parsed.length),
                            line,
                            char: char + parsed.length,
                        });
                    }

                    return ok('stop');
                }
                return ok(false);
            }

            function tryParseWhiteSpace(input: string, line: number, char: number): StepParseResult<DocumentPart> {
                if(opened && doesIt.startWithWhiteSpace.test(input)) {
                    return stripWhiteSpace(input, line, char);
                }
                return ok(false);
            }

            function tryEndAll(input: string, line: number, char: number): StepParseResult<DocumentPart> {
                if(!opened) {
                    return ok('stop');
                }

                return ok({
                    type: 'discard',
                    rest: input.slice(1),
                    line,
                    char: char + 1,
                })
            }

            const parser = parserBuilder.createParser(documentPath, tryParseOpenComment, tryParseCloseComment, tryParseWhiteSpace, tryEndAll);
            const parsed = parser.parse(toParse, startingLine, startingChar);

            if(opened) {
                return fail(`Open HTML Comment at { line: ${startingLine}, char: ${startingChar} } but does not close.`, documentPath);
            }
            if(parsed.success) {
                const [result, leftover] = parsed.value;
                if(0 < result.length) {
                    return ok({
                        type: 'parse group result',
                        subResult: result.map(r => { return { type: 'keep', keptValue: r }}),
                        rest: leftover.remaining,
                        line: leftover.location.line,
                        char: leftover.location.char,
                    });
                }
                else if(leftover.location.line !== startingLine || leftover.location.char !== startingChar) {
                    return ok({
                        type: 'discard',
                        rest: leftover.remaining,
                        line: leftover.location.line,
                        char: leftover.location.char,
                    });
                }
            }

            return ok(false);
        }
    }

    function isWord(documentPath: string) {
        return function isWord(toParse: string, startingLine: number, startingChar: number): StepParseResult<DocumentPart> {
            function tryParseEndParse(input: string, _line: number, _char: number): StepParseResult<string> {
                if(doesIt.startWithOpenComment.test(input)) {
                    return ok('stop')
                }
                return ok(false);
            }

            const tryParseWhiteSpace = isKeptWhiteSpace(documentPath, id);

            function tryParseWord(input: string, line: number, char: number): StepParseResult<string> {
                const startsWithWord = /^\w/;
                if(startsWithWord.test(input)) {
                    const parsed = input.charAt(0);
                    const rest = input.slice(1);
                    return ok({
                        type: 'parse result',
                        subResult: parsed,
                        rest,
                        line,
                        char: char + 1,
                    });
                }
                return ok(false);
            }

            const parser = parserBuilder.createParser(documentPath, tryParseEndParse, tryParseWhiteSpace, tryParseWord);
            const parsed = parser.parse(toParse, startingLine, startingChar);

            if(parsed.success) {
                const [parts, leftover] = parsed.value;
                if(leftover.location.line === startingLine && leftover.location.char === startingChar) {
                    return ok(false);
                }

                const result = parts.join('').trim();
                return ok({
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

    function parse(documentText: string, documentPath: string): Result<DocumentMap> {
        function parseNext(input: string, line: number, char: number): StepParseResult<DocumentPart> {
            let rest = input.slice(1);
            return ok({
                type: 'discard',
                rest,
                line,
                char: char + 1,
            });
        }

        const parser = parserBuilder.createParser(documentPath, isDiscardedWhiteSpace(documentPath), isMultiline(documentPath), isInline(documentPath), isComment(documentPath), isWord(documentPath), parseNext);
        const parsed = parser.parse(documentText, 1, 1);
        if(parsed.success) {
            const [parts, _remaining] = parsed.value;
            return ok(createMap(documentPath, parts));
        } else {
            return parsed;
        }
    }

    return parse;
}

const registerable: IRegisterable = {
    builder: (searches: Searcher, createParser: IInternals) => documentParse(searches.searchDocumentFor, createParser),
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'parser']
};

export {
    registerable as document,
};