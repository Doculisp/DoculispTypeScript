import { IAst, IAstParser, ISectionWriter } from "../types.ast";
import { IAstBuilder } from "../types.astBuilder";
import { IRegisterable } from "../types.containers";
import { DocumentParser } from "../types.document";
import { IFileLoader } from "../types.fileLoader";
import { IProjectLocation, IUtil, Result } from "../types.general";
import { TokenFunction } from "../types.tokens";

function buildAstBuilder(util: IUtil, astParse: IAstParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileLoader: IFileLoader) : IAstBuilder {

    function parse(target: Result<{ text: string; projectLocation: IProjectLocation; }>): Result<IAst> {
        throw new Error("Not Yet Implemented");
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

            const documentTextMaybe = fileLoader.load(load.path);
            if(!documentTextMaybe.success) {
                return documentTextMaybe;
            }

            const documentText = documentTextMaybe.value;

            const documentResult = documentParse(documentText, { documentDepth: ast.documentOrder.documentDepth + 1, documentIndex: index + 1, documentPath: load.path });
            const tokenResult = tokenizer(documentResult);
            const astResult = astParse.parse(tokenResult);
            if(!astResult.success) {
                return astResult;
            }

            const astDocument = astResult.value;
            if(astDocument.section.type === 'ast-empty') {
                continue;
            }

            const sectionMaybe = parseSection(astDocument.section);
            if(!sectionMaybe.success) {
                return sectionMaybe;
            }

            load.document = sectionMaybe.value;
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