import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser, DocumentPart } from "../types.document";
import { Result, ok } from "../types.general";
// import * as path from 'node:path';
import { IDocumentSearches, Searcher } from "../types.textHelpers";
import { IInternals, StepParseResult } from "../types.internal";

function createMap(documentPath: string, parts: DocumentPart[]): DocumentMap {
    return {
        documentPath,
        parts,
    };
}

function documentParse(doesIt: IDocumentSearches, parserBuilder: IInternals): Valid<DocumentParser> {
    function parse(documentText: string, documentPath: string): Result<DocumentMap> {
        function isDiscardedWhiteSpace(input: string, line: number, char: number): StepParseResult<DocumentPart> {
            if(doesIt.startWithWhiteSpace.test(input)) {
                const found: string = (input.match(doesIt.startWithWhiteSpace) as any)[0];
                return ok({
                    type: 'discard',
                    rest: input.slice(found.length),
                    line,
                    char: char + found.length,
                });
            }
            return ok(false);
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