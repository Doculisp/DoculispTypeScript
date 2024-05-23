import { IRegisterable } from "../types.containers";
import { DocumentMap } from "../types.document";
import { Result, fail } from "../types.general";
import { Token, TokenizedDocument } from "../types.tokens";

function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
    if(!documentMap.success) {
        return fail(documentMap.message, documentMap.documentPath);
    }
    
    const tokens: Token[] = [];

    function addToken(token: Token) {
        tokens[tokens.length] = token;
    }

    documentMap.value.parts.forEach(part => {
        if(part.type === 'text') {
            addToken({
                type: 'token - text',
                text: part.text,
                location: part.location,
            });
        } else {
            addToken({
                type: 'token - open parenthesis',
                location: part.location,
            });
            addToken({
                type: 'token - atom',
                value: '*',
                location: { line: part.location.line, char: part.location.char + 1 },
            });
            addToken({
                type: 'token - close parenthesis',
                location: { line: part.location.line, char: part.location.char + 2 },
            });
        }

    });

    return {
        success: true,
        value: {
            documentPath: documentMap.value.documentPath,
            tokens,
        },
    };
}

const tokenizer: IRegisterable = {
    builder: () => tokenize,
    name: 'tokenizer',
    singleton: true,
};

export {
    tokenizer,
};