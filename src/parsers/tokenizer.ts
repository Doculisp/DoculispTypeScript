import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { Result, fail, ok } from "../types.general";
import { IInternals, StepParseResult } from "../types.internal";
import { ILispSearches, Searcher } from "../types.textHelpers";
import { Token, TokenFunction, TokenizedDocument } from "../types.tokens";

function getTokenBuilder() {
    const tokens: Token[] = [];

    function addToken(token: Token): void {
        tokens[tokens.length] = token;
    }

    function addTokens(tokens: Token[]): void {
        tokens.forEach(addToken);
    }

    function getTokens(): Token[] {
        return Object.assign([], tokens);
    }

    return {
        addToken,
        addTokens,
        getTokens,
    };
}

function buildTokenize(doesIt: ILispSearches, parserBuilder: IInternals) : TokenFunction {
    function tokenizeWhiteSpace(input: string, line: number, char: number): StepParseResult<Token> {
        if(doesIt.startWithWindowsNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithWindowsNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: input,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithLinuxNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithLinuxNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: input,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithMacsNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithMacsNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: input,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithWhiteSpace.test(input)) {
            const space = (input.match(doesIt.startWithWhiteSpace) as any)[0] as string;
            input = input.slice(space.length);
            char += space.length;
            return ok({
                rest: input,
                line,
                char,
                type: 'discard',
            });
        }

        return ok(false);
    }

    function tokenizeParenthesis(input: string, line: number, char: number): StepParseResult<Token> {
        if(doesIt.startWithOpenLisp.test(input)) {
            let open: Token = {
                location: { line, char },
                type: 'token - open parenthesis',
            };

            char++;

            return ok({
                subResult: open,
                line,
                char,
                rest: input.slice(1),
                type: "parse result",
            });
        }

        if(doesIt.startsWithCloseLisp.test(input)) {
            let close: Token = {
                type: 'token - close parenthesis',
                location: { line, char },
            };

            char++;
            
            return ok({
                subResult: close,
                line,
                char,
                rest: input.slice(1),
                type: "parse result",
            });
        }

        return ok(false);
    }

    function tokenizeAtom(input: string, line: number, char: number): StepParseResult<Token> {
        let doesItStartWithWord = /[\w\*\-]+/;
        if(doesItStartWithWord.test(input)) {
            let atomValue: string = (input.match(doesItStartWithWord) as any)[0];

            let atom: Token = {
                type: 'token - atom',
                text: atomValue,
                location: { line, char },
            };

            char += atomValue.length;

            return ok({
                subResult: atom,
                line,
                char,
                rest: input.slice(atomValue.length),
                type: "parse result",
            });
        }

        return ok(false);
    }

    const totalTokens = getTokenBuilder();
    const parser = parserBuilder.createParser(tokenizeWhiteSpace, tokenizeParenthesis, tokenizeAtom);

    return function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
        if(!documentMap.success) {
            return fail(documentMap.message, documentMap.documentPath);
        }
        
        const documentPath = documentMap.value.documentPath;
        
        function toTokens(block: ILispBlock): Result<Token[]> {
            let parsed = parser.parse(block.text, block.location.line, block.location.char);
            if(parsed.success) {
                let [ret, _ignore] = parsed.value;
                return ok(ret);
            } else {
                return parsed;
            }
        }

        let parts = documentMap.value.parts;
        for (let index = 0; index < parts.length; index++) {
            const part = parts[index] as DocumentPart;
            if(part.type === 'text') {
                totalTokens.addToken({
                    type: 'token - text',
                    text: part.text,
                    location: part.location,
                });
            } else {
                let tokens = toTokens(part);
                if (tokens.success) {
                    totalTokens.addTokens(tokens.value);
                } else {
                    return fail(tokens.message, documentPath);
                }
            }
        }

        return ok({
            documentPath: documentPath,
            tokens: totalTokens.getTokens(),
        });
    }
}

const tokenizer: IRegisterable = {
    builder: (searches: Searcher, getParser: IInternals) => buildTokenize(searches.searchLispFor, getParser),
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'parser']
};

export {
    tokenizer,
};