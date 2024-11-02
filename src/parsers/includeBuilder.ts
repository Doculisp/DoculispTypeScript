import { IDoculisp, IDoculispParser, IEmptyDoculisp, ISectionWriter } from "../types/types.astDoculisp";
import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { DocumentParser } from "../types/types.document";
import { IFileHandler } from "../types/types.fileHandler";
import { IProjectLocation, IUtil, Result } from "../types/types.general";
import { TokenFunction } from "../types/types.tokens";
import { IAstParser } from "../types/types.ast";
import { IVariableSaver } from "../types/types.variableTable";
import { IPath } from "../types/types.filePath";

function buildAstBuilder(util: IUtil, doculispParser: IDoculispParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any, astParser: IAstParser) : IIncludeBuilder {

    function _parse(filePath: IPath, location: IProjectLocation, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
        const workingDir = fileHandler.getProcessWorkingDirectory();

        if(!workingDir.success) {
            return workingDir;
        }

        const targetDir = filePath.getContainingDir();
        try {
            const success = fileHandler.setProcessWorkingDirectory(targetDir);

            if(!success.success) {
                return success;
            }

            const fileMaybe = fileHandler.load(filePath);
            if(!fileMaybe.success) {
                return fileMaybe;
            }
    
            const documentResult = documentParse(fileMaybe.value, location);
            const tokens = tokenizer(documentResult);
            const ast = astParser.parse(tokens);
            const doculisp = doculispParser.parse(ast, variableTable);

            return parseExternals(doculisp, variableTable);
        }
        finally {
            fileHandler.setProcessWorkingDirectory(workingDir.value);
        }
    }

    function parse(filePath: IPath, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
        return _parse(filePath, { documentDepth: 1, documentIndex: 1, documentPath: filePath }, variableTable);
    }

    function parseSection(doculisp: ISectionWriter, variableTable: IVariableSaver): Result<ISectionWriter> {
        for (let index = 0; index < doculisp.include.length; index++) {
            const load = doculisp.include[index];
            if(!load) {
                continue;
            }

            if(load.document) {
                parseSection(load.document, variableTable);
                continue;
            }

            const astResult = _parse(load.path, { documentDepth: doculisp.documentOrder.documentDepth + 1, documentIndex: index + 1, documentPath: load.path}, variableTable);
            if(!astResult.success) {
                return astResult;
            }

            const astDocument = astResult.value;
            if(astDocument.type === 'doculisp-empty') {
                continue;
            }

            load.document = astDocument.section;
        }

        return util.ok(doculisp);
    }

    function parseExternals(astResult: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
        if(!astResult.success) {
            return astResult;
        }

        const doculisp = astResult.value;
        if(doculisp.type === 'doculisp-empty') {
            return astResult;
        }

        const newSection = parseSection(doculisp.section, variableTable);

        if(!newSection.success) {
            return newSection;
        }

        doculisp.section = newSection.value;

        return util.ok(doculisp);
    }

    return {
        parse,
        parseExternals,
    };
}

const astBuilder : IRegisterable = {
    builder: (util: IUtil, astParse: IDoculispParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any, astParser: IAstParser) => buildAstBuilder(util, astParse, documentParse, tokenizer, fileHandler, path, astParser),
    name: 'includeBuilder',
    singleton: true,
    dependencies: ['util', 'astDoculispParse', 'documentParse', 'tokenizer', 'fileHandler', 'path', 'astParser']
};

export {
    astBuilder
};