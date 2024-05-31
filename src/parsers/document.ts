import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { Result, ok } from "../types.general";
// import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { HandleValue, IInternals, StepParseResult } from "../types.internal";

function createMap(documentPath: string, parts: DocumentPart[]): DocumentMap {
    return {
        documentPath,
        parts,
    };
}

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals): Valid<DocumentParser> {
    function doesItStartWithDiscarded(regex: RegExp, lineIncrement: (line: number) => number, charIncrement: (char: number, found: string) => number): HandleValue<DocumentPart> {
        return function (input: string, line: number, char: number): StepParseResult<DocumentPart> {
            if(regex.test(input)) {
                const found: string = (input.match(regex) as any)[0];
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


    function isDiscardedWhiteSpace(input: string, line: number, char: number): StepParseResult<DocumentPart> {
        const isWindows = doesItStartWithDiscarded(doesIt.startWithWindowsNewline, l => l + 1, () => 1);
        const isLinux = doesItStartWithDiscarded(doesIt.startWithLinuxNewline, l => l + 1, () => 1);
        const isMac = doesItStartWithDiscarded(doesIt.startWithMacsNewline, l => l + 1, () => 1);
        const isWhiteSpace = doesItStartWithDiscarded(doesIt.startWithWhiteSpace, l => l, (c, f) => c + f.length);
        function isOver(input: string, line: number, char: number): StepParseResult<DocumentPart> {
            const regex = /\S+/;
            if(regex.test(input)) {
                return ok('stop');
            }
            return ok(false);
        }

        const whiteSpaceParser = parserBuilder.createParser(isWindows, isLinux, isMac, isWhiteSpace, isOver);
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

    function isWord(input: string, line: number, char: number): StepParseResult<DocumentPart> {
        return ok({
            type: 'parse result',
            subResult: {
                text: input.trim(),
                location: { line, char, },
                type: 'text'
            },
            rest: '',
            char: char + input.length,
            line,
        });
    }

    function parse(documentText: string, documentPath: string): Result<DocumentMap> {
        const parser = parserBuilder.createParser(isDiscardedWhiteSpace, isWord);
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