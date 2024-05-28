import { IRegisterable } from "../types.containers";
import { DocumentMap, DocumentPart, ILispBlock } from "../types.document";
import { Result, fail, ok } from "../types.general";
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
            let doesItStartWithWord = /[\w\*]+/;

            while(0 < value.length) {
                if(doesIt.startWithOpenLisp.test(value)) {
                    let open: Token = {
                        location: { line, char },
                        type: 'token - open parenthesis',
                    };

                    results.addToken(open);
                    char++;
                    value = value.slice(1);
                    continue;
                }

                if(doesIt.startsWithCloseLisp.test(value)) {
                    let close: Token = {
                        type: 'token - close parenthesis',
                        location: { line, char },
                    };

                    results.addToken(close);
                    char++;
                    value = value.slice(1);
                    continue;
                }

                if(doesIt.startWithWindowsNewline.test(value)) {
                    const newLine = (value.match(doesIt.startWithWindowsNewline) as any)[0] as string;
                    value = value.slice(newLine.length);
                    line++;
                    char = 0;
                    continue;
                }

                if(doesIt.startWithLinuxNewline.test(value)) {
                    const newLine = value.match(doesIt.startWithLinuxNewline) as any as string;
                    value = value.slice(newLine.length);
                    line++;
                    char = 0;
                    continue;
                }

                if(doesIt.startWithMacsNewline.test(value)) {
                    const newLine = value.match(doesIt.startWithMacsNewline) as any as string;
                    value = value.slice(newLine.length);
                    line++;
                    char = 0;
                    continue;
                }

                if(doesItStartWithWord.test(value)) {
                    let atomValue: string = (value.match(doesItStartWithWord) as any)[0];

                    let atom: Token = {
                        type: 'token - atom',
                        value: atomValue,
                        location: { line, char },
                    };

                    results.addToken(atom);
                    char += atomValue.length;
                    value = value.slice(atomValue.length);
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