import { IRegisterable } from "../types.containers";
import { DocumentMap } from "../types.document";
import { Result, fail } from "../types.general";
import { TokenizedDocument } from "../types.tokens";

function tokenize (documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
    if(!documentMap.success) {
        return fail(documentMap.message, documentMap.documentPath);
    }
    return fail('Not yet implemented', documentMap.value.documentPath);
}

const tokenizer: IRegisterable = {
    builder: () => tokenize,
    name: 'tokenizer',
    singleton: true,
};

export {
    tokenizer,
};