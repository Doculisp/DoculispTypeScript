import { IRegisterable } from "../types.containers";
import { DocumentMap } from "../types.document";
import { Result, fail } from "../types.general";
import { Token, TokenizedDocument } from "../types.tokens";

function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
    if(!documentMap.success) {
        return fail(documentMap.message, documentMap.documentPath);
    }
    
    const tokens: Token[] = [];

    documentMap.value.parts.forEach(part => {
        if(part.type === 'text') {
            tokens[tokens.length] = {
                type: 'token - text',
                text: part.text,
                location: part.location,
            };
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