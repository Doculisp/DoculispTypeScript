import { IRegisterable } from "../types.containers";
import { DocumentMap, ILispBlock } from "../types.document";
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

    function toTokens(block: ILispBlock): Token[] {
        let start = block.location;
        return [
            {
                type: 'token - open parenthesis',
                location: start,
            },
            {
                type: 'token - atom',
                value: '*',
                location: { line: start.line, char: start.char + 1 },
            },
            {
                type: 'token - close parenthesis',
                location: { line: start.line, char: start.char + 2 },
            }
        ];
    }

    documentMap.value.parts.forEach(part => {
        if(part.type === 'text') {
            addToken({
                type: 'token - text',
                text: part.text,
                location: part.location,
            });
        } else {
            toTokens(part).forEach(addToken);
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