import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { ILocation, IUtil, Result } from "../types.general";
import { IInternals, StringStepParseResult } from "../types.internal";
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

function buildTokenize(doesIt: ILispSearches, parserBuilder: IInternals, util: IUtil) : TokenFunction {
    let isToken = false;
    const ok = util.ok;
    const fail = util.fail;

    function tokenizeWhiteSpace(input: string, current: ILocation): StringStepParseResult<Token> {
        if(doesIt.startWithWindowsNewline.test(input)) {
            isToken = false;
            const newLine = (input.match(doesIt.startWithWindowsNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            const line = current.line + 1;
            const char = 1;
            return util.ok({
                rest: input,
                char,
                line,
                type: 'discard',
            });
        }

        if(doesIt.startWithLinuxNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithLinuxNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            const line = current.line + 1;
            const char = 1;
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
            const line = current.line + 1;
            const char = 1;
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
            const char = current.char + space.length;
            return ok({
                rest: input,
                line: current.line,
                char,
                type: 'discard',
            });
        }

        return ok(false);
    }

    function tokenizeComment(toParse: string, starting: ILocation): StringStepParseResult<Token> {
        let depth = 0;
        function tryParse(startsWith: RegExp, input: string, current: ILocation): StringStepParseResult<string> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);

                return ok({
                    type: 'discard',
                    rest,
                    line: current.line,
                    char: current.char + parsed.length,
                });
            }
            return ok(false);
        }
        
        function tryParseOpenComment(input: string, current: ILocation): StringStepParseResult<string> {
            const startsWithComment = /^\(\*/;
            const result = tryParse(startsWithComment, input, current);
            if(result.success && result.value) {
                depth++;
            }

            return result;
        }

        function tryParseOpenParen(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                const result = tryParse(doesIt.startWithOpenLisp, input, current);
                if(result.success && result.value) {
                    depth++;
                }
                return result;
            }
            return ok('stop');
        }

        function tryParseCloseParen(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                const result = tryParse(doesIt.startsWithCloseLisp, input, current);
                if(result.success && result.value) {
                    depth --;
                }
                return result;
            }
            return ok('stop');
        }

        function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                let parsed = tokenizeWhiteSpace(input, current);
                if(parsed.success) {
                    if(parsed.value && parsed.value !== 'stop'){
                        return ok({
                            type: 'discard',
                            rest: parsed.value.rest,
                            line: parsed.value.line,
                            char: parsed.value.char,
                        });
                    }
                    return ok(false);
                }
                return parsed;
            }
            return ok('stop')
        }

        function tryParseText(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                return tryParse(/^./, input, current);
            }
            return ok('stop')
        }

        const parser = parserBuilder.createStringParser(tryParseOpenComment, tryParseOpenParen, tryParseCloseParen, tryParseWhiteSpace, tryParseText);
        const parsed = parser.parse(toParse, starting);

        if(parsed.success) {
            const [_parts, leftover] = parsed.value;
            if(leftover.line === starting.line && leftover.char === starting.char) {
                return ok(false);
            }

            return ok({
                type: 'discard',
                rest: leftover.remaining,
                line: leftover.line,
                char: leftover.char,
            });
        }
        return parsed;
    }

    function tokenizeParenthesis(input: string, current: ILocation): StringStepParseResult<Token> {
        if(doesIt.startWithOpenLisp.test(input)) {
            let open: Token = {
                location: current,
                type: 'token - open parenthesis',
            };
            isToken = true;

            const char = current.char + 1;

            return ok({
                subResult: open,
                line: current.line,
                char,
                rest: input.slice(1),
                type: "parse result",
            });
        }

        if(doesIt.startsWithCloseLisp.test(input)) {
            let close: Token = {
                type: 'token - close parenthesis',
                location: current,
            };

            const char = current.char + 1;
            
            return ok({
                subResult: close,
                line: current.line,
                char,
                rest: input.slice(1),
                type: "parse result",
            });
        }

        return ok(false);
    }

    function tokenizeAtom(input: string, current: ILocation): StringStepParseResult<Token> {
        let doesItStartWithWord = /^[^\(\)\s]+/;
        if(doesItStartWithWord.test(input) && isToken) {
            let atomValue: string = (input.match(doesItStartWithWord) as any)[0];

            let atom: Token = {
                type: 'token - atom',
                text: atomValue,
                location: current,
            };

            isToken = false;
            const char = current.char + atomValue.length;

            return ok({
                subResult: atom,
                line: current.line,
                char,
                rest: input.slice(atomValue.length),
                type: "parse result",
            });
        }

        return ok(false);
    }

    function tokenizeParameter(input: string, current: ILocation): StringStepParseResult<Token> {
        let doesItStartWithParameter = /^[^\)\s]+[^\)]*/;
        if(doesItStartWithParameter.test(input) && !isToken) {
            let parameterValue: string = (input.match(doesItStartWithParameter) as any)[0];

            let atom: Token = {
                type: 'token - parameter',
                text: parameterValue.trim(),
                location: current,
            };

            const char = current.char + parameterValue.length;

            return ok({
                type: 'parse result',
                subResult: atom,
                rest: input.slice(parameterValue.length),
                line: current.line,
                char,
            });
        }

        return ok(false);
    }

    const totalTokens = getTokenBuilder();

    return function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
        if(!documentMap.success) {
            return fail(documentMap.message, documentMap.documentPath);
        }
        
        const documentPath = documentMap.value.documentPath;
        const parser = parserBuilder.createStringParser(tokenizeWhiteSpace, tokenizeComment, tokenizeParenthesis, tokenizeParameter, tokenizeAtom);
        
        function toTokens(block: ILispBlock): Result<Token[]> {
            let parsed = parser.parse(block.text, block.location);
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
    builder: (searches: Searcher, getParser: IInternals, util: IUtil) => buildTokenize(searches.searchLispFor, getParser, util),
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'parser', 'util']
};

export {
    tokenizer,
};