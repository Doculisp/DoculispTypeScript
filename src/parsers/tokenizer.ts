import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { ILocation, IUtil, Result, isSame } from "../types.general";
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

function buildTokenize(doesIt: ILispSearches, internals: IInternals, util: IUtil) : TokenFunction {
    let isToken = false;
    
    function tokenizeWhiteSpace(input: string, current: ILocation): StringStepParseResult<Token> {
        if(doesIt.startWithWindowsNewline.test(input)) {
            isToken = false;
            const newLine = (input.match(doesIt.startWithWindowsNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseLine(),
            });
        }

        if(doesIt.startWithLinuxNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithLinuxNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseLine(),
            });
        }

        if(doesIt.startWithMacsNewline.test(input)) {
            const newLine = (input.match(doesIt.startWithMacsNewline) as any)[0] as string;
            input = input.slice(newLine.length);
            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseLine(),
            });
        }

        if(doesIt.startWithWhiteSpace.test(input)) {
            const space = (input.match(doesIt.startWithWhiteSpace) as any)[0] as string;
            input = input.slice(space.length);
            return util.ok({
                type: 'discard',
                rest: input,
                location: current.increaseChar(space.length),
            });
        }

        return internals.noResultFound()
    }

    function tokenizeComment(toParse: string, starting: ILocation): StringStepParseResult<Token> {
        let depth = 0;
        function tryParse(startsWith: RegExp, input: string, current: ILocation): StringStepParseResult<string> {
            if(startsWith.test(input)) {
                const parsed: string = (input.match(startsWith) as any)[0];
                const rest = input.slice(parsed.length);

                return util.ok({
                    type: 'discard',
                    rest,
                    location: current.increaseChar(parsed.length),
                });
            }
            return internals.noResultFound()
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
            return internals.stopFindingResults();
        }

        function tryParseCloseParen(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                const result = tryParse(doesIt.startsWithCloseLisp, input, current);
                if(result.success && result.value) {
                    depth --;
                }
                return result;
            }
            return internals.stopFindingResults();
        }

        function tryParseWhiteSpace(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                let parsed = tokenizeWhiteSpace(input, current);
                if(parsed.success) {
                    if(parsed.value && parsed.value !== 'stop'){
                        return util.ok({
                            type: 'discard',
                            rest: parsed.value.rest,
                            location: parsed.value.location,
                        });
                    }
                    return internals.noResultFound()
                }
                return parsed;
            }
            return internals.stopFindingResults()
        }

        function tryParseText(input: string, current: ILocation): StringStepParseResult<string> {
            if(0 < depth) {
                return tryParse(/^./, input, current);
            }
            return internals.stopFindingResults()
        }

        const parser = internals.createStringParser(tryParseOpenComment, tryParseOpenParen, tryParseCloseParen, tryParseWhiteSpace, tryParseText);
        const parsed = parser.parse(toParse, starting);

        if(parsed.success) {
            const [_parts, leftover] = parsed.value;
            if(leftover.location.compare(starting) === isSame) {
                return internals.noResultFound()
            }

            return util.ok({
                type: 'discard',
                rest: leftover.remaining,
                location: leftover.location,
            });
        }
        return parsed;
    }

    function tokenizeParenthesis(input: string, current: ILocation): StringStepParseResult<Token> {
        if(doesIt.startWithOpenLisp.test(input)) {
            let open: Token = {
                type: 'token - open parenthesis',
                location: current,
            };
            isToken = true;

            return util.ok({
                type: "parse result",
                subResult: open,
                rest: input.slice(1),
                location: current.increaseChar(),
            });
        }

        if(doesIt.startsWithCloseLisp.test(input)) {
            let close: Token = {
                type: 'token - close parenthesis',
                location: current,
            };
            
            return util.ok({
                type: "parse result",
                subResult: close,
                rest: input.slice(1),
                location: current.increaseChar(),
            });
        }

        return internals.noResultFound()
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

            return util.ok({
                subResult: atom,
                rest: input.slice(atomValue.length),
                type: "parse result",
                location: current.increaseChar(atomValue.length),
            });
        }

        return internals.noResultFound()
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

            return util.ok({
                type: 'parse result',
                subResult: atom,
                rest: input.slice(parameterValue.length),
                location: current.increaseChar(parameterValue.length),
            });
        }

        return internals.noResultFound()
    }

    const totalTokens = getTokenBuilder();

    return function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
        if(!documentMap.success) {
            return util.fail(documentMap.message, documentMap.documentPath);
        }
        
        const documentPath = documentMap.value.projectLocation.documentPath;
        const parser = internals.createStringParser(tokenizeWhiteSpace, tokenizeComment, tokenizeParenthesis, tokenizeParameter, tokenizeAtom);
        
        function toTokens(block: ILispBlock): Result<Token[]> {
            let parsed = parser.parse(block.text, block.location);
            if(parsed.success) {
                let [ret, _ignore] = parsed.value;
                return util.ok(ret);
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
                    return util.fail(tokens.message, documentPath);
                }
            }
        }

        return util.ok({
            projectLocation: documentMap.value.projectLocation,
            tokens: totalTokens.getTokens(),
        });
    }
}

const tokenizer: IRegisterable = {
    builder: (searches: Searcher, internals: IInternals, util: IUtil) => buildTokenize(searches.searchLispFor, internals, util),
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
};

export {
    tokenizer,
};