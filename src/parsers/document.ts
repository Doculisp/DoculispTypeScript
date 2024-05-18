import { IRegisterable, Valid } from "../types.containers";
import { DocumentMap, DocumentParser } from "../types.document";
import { Result, ok } from "../types.general";

function documentParse(): Valid<DocumentParser> {
    function parse(value: string, path: string): Result<DocumentMap> {
        if(0 === value.length) {
            return ok([]);
        }

        return ok([{ location: { line: 0, char: 0, document: 'C:/my_document.md' }, text: 'hello', type: 'text'}]);
    }

    return parse;
}

const registerable: IRegisterable = {
    builder: documentParse,
    name: 'documentParse',
    singleton: true,
};

export {
    registerable as document,
};