import { IAst, IAstParser } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { DocumentParser } from "../types.document";
import { IProjectLocation, Result } from "../types.general";
import { IGrandParser } from "../types.grandParser";
import { TokenFunction } from "../types.tokens";

function buildParser(document: DocumentParser, tockenizer: TokenFunction, astParser: IAstParser): IGrandParser {
    function parse(documentPath: string, text: string, depth: number, index: number): Result<IAst> {
        const projectLocation: IProjectLocation = {
            documentDepth: depth,
            documentIndex: index,
            documentPath,
        };

        const blocks = document(text, projectLocation);
        const tokens = tockenizer(blocks);
        return astParser.parse(tokens);
    }

    return {
        parse,
    };
}


const grandParser: IRegisterable = {
    builder: (document: DocumentParser, tockenizer: TokenFunction, astParser: IAstParser) => buildParser(document, tockenizer, astParser),
    name: 'grandParser',
    singleton: true,
    dependencies: ['documentParse', 'tokenizer', 'astParse', 'internals', 'util']
};

export {
    grandParser as astParser,
};