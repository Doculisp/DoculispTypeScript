import { IAst, IAstParser, ISectionWriter } from "../types/types.astDoculisp";
import { IAstBuilder } from "../types/types.astBuilder";
import { IRegisterable } from "../types/types.containers";
import { DocumentParser } from "../types/types.document";
import { IFileHandler } from "../types/types.fileHandler";
import { IProjectLocation, IUtil, Result } from "../types/types.general";
import { TokenFunction } from "../types/types.tokens";

function buildAstBuilder(util: IUtil, astParse: IAstParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any) : IAstBuilder {

    function _parse(filePath: string, location: IProjectLocation): Result<IAst> {
        const workingDir = fileHandler.getProcessWorkingDirectory();
        const targetDir = path.resolve(path.dirname(filePath));
        try {
            fileHandler.setProcessWorkingDirectory(targetDir);

            const fileMaybe = fileHandler.load(path.basename(filePath));
            if(!fileMaybe.success) {
                return fileMaybe;
            }
    
            const documentResult = documentParse(fileMaybe.value, location);
            const tokens = tokenizer(documentResult);
            const ast = astParse.parse(tokens);

            return parseExternals(ast);
        }
        finally {
            fileHandler.setProcessWorkingDirectory(workingDir);
        }
    }

    function parse(filePath: string): Result<IAst> {
        return _parse(filePath, { documentDepth: 1, documentIndex: 1, documentPath: filePath });
    }

    function parseSection(ast: ISectionWriter): Result<ISectionWriter> {
        for (let index = 0; index < ast.include.length; index++) {
            const load = ast.include[index];
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
    builder: (util: IUtil, astParse: IAstParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any) => buildAstBuilder(util, astParse, documentParse, tokenizer, fileHandler, path),
    name: 'astBuilder',
    singleton: true,
    dependencies: ['util', 'astDoculispParse', 'documentParse', 'tokenizer', 'fileHandler', 'path']
};

export {
    astBuilder
};