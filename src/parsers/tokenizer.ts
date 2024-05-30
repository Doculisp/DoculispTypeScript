import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { Result, fail, ok } from "../types.general";
import { CreateParser, StepParseResult } from "../types.internal";
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

function buildTokenize(doesIt: ILispSearches, createParser: CreateParser<Token>) : TokenFunction {
    function tokenizeWhiteSpace(value: string, line: number, char: number): StepParseResult<Token> {
        if(doesIt.startWithWindowsNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithWindowsNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: value,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithLinuxNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithLinuxNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: value,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithMacsNewline.test(value)) {
            const newLine = (value.match(doesIt.startWithMacsNewline) as any)[0] as string;
            value = value.slice(newLine.length);
            line++;
            char = 0;
            return ok({
                rest: value,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithWhiteSpace.test(value)) {
            const space = (value.match(doesIt.startWithWhiteSpace) as any)[0] as string;
            value = value.slice(space.length);
            char += space.length;
            return ok({
                rest: value,
                line,
                char,
                type: 'discard',
            });
        }

        return ok(false);
    }

    function tokenizeParenthesis(value: string, line: number, char: number): StepParseResult<Token> {
        if(doesIt.startWithOpenLisp.test(value)) {
            let open: Token = {
                location: { line, char },
                type: 'token - open parenthesis',
            };

            char++;

            return ok({
                result: open,
                line,
                char,
                rest: value.slice(1),
                type: "parse result",
            });
        }

        if(doesIt.startsWithCloseLisp.test(value)) {
            let close: Token = {
                type: 'token - close parenthesis',
                location: { line, char },
            };

            char++;
            
            return ok({
                result: close,
                line,
                char,
                rest: value.slice(1),
                type: "parse result",
            });
        }

        return ok(false);
    }

    function tokenizeAtom(value: string, line: number, char: number): StepParseResult<Token> {
        let doesItStartWithWord = /[\w\*\-]+/;
        if(doesItStartWithWord.test(value)) {
            let atomValue: string = (value.match(doesItStartWithWord) as any)[0];

            let atom: Token = {
                type: 'token - atom',
                value: atomValue,
                location: { line, char },
            };

            char += atomValue.length;

            return ok({
                result: atom,
                line,
                char,
                rest: value.slice(atomValue.length),
                type: "parse result",
            });
        }

        return ok(false);
    }

    const totalTokens = getTokenBuilder();
    const parser = createParser(tokenizeWhiteSpace, tokenizeParenthesis, tokenizeAtom);

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
    builder: (searches: Searcher, getParser: CreateParser<Token>) => buildTokenize(searches.searchLispFor, getParser),
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'parser']
};

export {
    tokenizer,
};