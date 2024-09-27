import { IAst, IAstParser, ISectionWriter } from "../types.ast";
import { IAstBuilder } from "../types.astBuilder";
import { IRegisterable } from "../types.containers";
import { DocumentParser } from "../types.document";
import { IFileLoader } from "../types.fileLoader";
import { IProjectLocation, IUtil, Result } from "../types.general";
import { TokenFunction } from "../types.tokens";

function buildAstBuilder(util: IUtil, astParse: IAstParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileLoader: IFileLoader) : IAstBuilder {

    function _parse(path: string, location: IProjectLocation): Result<IAst> {
        const fileMaybe = fileLoader.load(path);
        if(!fileMaybe.success) {
            return fileMaybe;
        }

        const documentResult = documentParse(fileMaybe.value, location);
        const tokens = tokenizer(documentResult);
        const ast = astParse.parse(tokens);

        return parseExternals(ast);
    }

    function parse(path: string): Result<IAst> {
        return _parse(path, { documentDepth: 1, documentIndex: 1, documentPath: path });
    }

    function parseSection(ast: ISectionWriter): Result<ISectionWriter> {
        for (let index = 0; index < ast.external.length; index++) {
            const load = ast.external[index];
            if(!load) {
                continue;
            }

            if(load.document) {
                parseSection(load.document);
                continue;
            }

            const astResult = _parse(load.path, { documentDepth: ast.documentOrder.documentDepth + 1, documentIndex: index + 1, documentPath: load.path});
            if(!astResult.success) {
                return astResult;
            }

            const astDocument = astResult.value;
            if(astDocument.section.type === 'ast-empty') {
                continue;
            }

            load.document = astDocument.section;
        }

        return util.ok(ast);
    }

    function parseExternals(astResult: Result<IAst>): Result<IAst> {
        if(!astResult.success) {
            return astResult;
        }

        const ast = astResult.value;
        if(ast.section.type === 'ast-empty') {
            return astResult;
        }

        const newSection = parseSection(ast.section);

        if(!newSection.success) {
            return newSection;
        }

        ast.section = newSection.value;

        return util.ok(ast);
    }

    return {
        parse,
        parseExternals,
    };
}

const astBuilder : IRegisterable = {
    builder: (util: IUtil, astParse: IAstParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileLoader: IFileLoader) => buildAstBuilder(util, astParse, documentParse, tokenizer, fileLoader),
    name: 'astBuilder',
    singleton: true,
    dependencies: ['util', 'astParse', 'documentParse', 'tokenizer', 'fileLoader']
};

export {
    astBuilder
};