import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { Result, fail, ok } from "../types.general";
import { ParseResult } from "../types.internal";
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

function buildTokenize(doesIt: ILispSearches) : TokenFunction {
    function tokenizeWhiteSpace(value: string, line: number, char: number): ParseResult<string> | false {
        if(doesIt.startWithWindowsNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithWindowsNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return {
                result: newLine,
                rest: value,
                char,
                line,
            };
        }

        if(doesIt.startWithLinuxNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithLinuxNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return {
                result: newLine,
                rest: value,
                char,
                line,
            };
        }

        if(doesIt.startWithMacsNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithMacsNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return {
                result: newLine,
                rest: value,
                char,
                line,
            };
        }

        if(doesIt.startWithWhiteSpace.test(value)) {
            const space = (value.match(doesIt.startWithWhiteSpace) as any)[0] as string;
            value = value.slice(space.length);
            char += space.length;
            return {
                result: space,
                rest: value,
                line,
                char,
            }
        }

        return false;
    }

    function tokenizeParenthesis(value: string, line: number, char: number): ParseResult<Token> | false {
        if(doesIt.startWithOpenLisp.test(value)) {
            let open: Token = {
                location: { line, char },
                type: 'token - open parenthesis',
            };

            char++;

            return {
                result: open,
                line,
                char,
                rest: value.slice(1),
            };
        }

        if(doesIt.startsWithCloseLisp.test(value)) {
            let close: Token = {
                type: 'token - close parenthesis',
                location: { line, char },
            };

            char++;
            
            return {
                result: close,
                line,
                char,
                rest: value.slice(1),
            };
        }

        return false;
    }

    function tokenizeAtom(value: string, line: number, char: number): ParseResult<Token> | false {
        let doesItStartWithWord = /[\w\*\-]+/;
        if(doesItStartWithWord.test(value)) {
            let atomValue: string = (value.match(doesItStartWithWord) as any)[0];

            let atom: Token = {
                type: 'token - atom',
                value: atomValue,
                location: { line, char },
            };

            char += atomValue.length;

            return {
                result: atom,
                line,
                char,
                rest: value.slice(atomValue.length),
            };
        }

        return false;
    }

    return function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
        if(!documentMap.success) {
            return fail(documentMap.message, documentMap.documentPath);
        }
        
        const documentPath = documentMap.value.documentPath;
        const totalTokens = getTokenBuilder();

        function toTokens(block: ILispBlock): Result<Token[]> {
            let value = block.text;
            let line = block.location.line;
            let char = block.location.char;
            let results = getTokenBuilder();

            function tryTokenize<T>(tokenizer: (value: string, line: number, char: number) => ParseResult<T> | false, handler: (result: T) => void): (value: string, line: number, char: number) => boolean {
                return function tryIt(target: string, currentLine: number, currentChar: number): boolean {
                    const token = tokenizer(target, currentLine, currentChar);
                    if(token) {
                        line = token.line;
                        char = token.char;
                        value = token.rest;
                        handler(token.result);
                        return true;
                    }

                    return false;
                }
            }

            const tryLisp = tryTokenize(tokenizeParenthesis, (result: Token) => results.addToken(result));
            const tryWhiteSpace = tryTokenize(tokenizeWhiteSpace, () => {});
            const tryAtom = tryTokenize(tokenizeAtom, (result: Token) => results.addToken(result));
            
            while(0 < value.length) {
                if(tryLisp(value, line, char)) {
                    continue;
                }

                if(tryWhiteSpace(value, line, char)) {
                    continue;
                }

                if(tryAtom(value, line, char)) {
                    continue;
                }

                value = value.slice(1);
                char++;
            }

            return ok(results.getTokens());
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
    builder: (searches: Searcher) => buildTokenize(searches.searchLispFor),
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches']
};

export {
    tokenizer,
};