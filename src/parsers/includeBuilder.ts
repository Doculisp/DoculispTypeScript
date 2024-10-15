import { IDoculisp, IDoculispParser, ISectionWriter } from "../types/types.astDoculisp";
import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { DocumentParser } from "../types/types.document";
import { IFileHandler } from "../types/types.fileHandler";
import { IProjectLocation, IUtil, Result } from "../types/types.general";
import { TokenFunction } from "../types/types.tokens";

function buildAstBuilder(util: IUtil, astParse: IDoculispParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any) : IIncludeBuilder {

    function _parse(filePath: string, location: IProjectLocation): Result<IDoculisp> {
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
            const doculisp = astParse.parse(tokens);

            return parseExternals(doculisp);
        }
        finally {
            fileHandler.setProcessWorkingDirectory(workingDir);
        }
    }

    function parse(filePath: string): Result<IDoculisp> {
        return _parse(filePath, { documentDepth: 1, documentIndex: 1, documentPath: filePath });
    }

    function parseSection(doculisp: ISectionWriter): Result<ISectionWriter> {
        for (let index = 0; index < doculisp.include.length; index++) {
            const load = doculisp.include[index];
            if(!load) {
                continue;
            }

            if(load.document) {
                parseSection(load.document);
                continue;
            }

            const astResult = _parse(load.path, { documentDepth: doculisp.documentOrder.documentDepth + 1, documentIndex: index + 1, documentPath: load.path});
            if(!astResult.success) {
                return astResult;
            }

            const astDocument = astResult.value;
            if(astDocument.section.type === 'doculisp-empty') {
                continue;
            }

            load.document = astDocument.section;
        }

        return util.ok(doculisp);
    }

    function parseExternals(astResult: Result<IDoculisp>): Result<IDoculisp> {
        if(!astResult.success) {
            return astResult;
        }

        const doculisp = astResult.value;
        if(doculisp.section.type === 'doculisp-empty') {
            return astResult;
        }

        const newSection = parseSection(doculisp.section);

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
    builder: (util: IUtil, astParse: IDoculispParser, documentParse: DocumentParser, tokenizer: TokenFunction, fileHandler: IFileHandler, path: any) => buildAstBuilder(util, astParse, documentParse, tokenizer, fileHandler, path),
    name: 'includeBuilder',
    singleton: true,
    dependencies: ['util', 'astDoculispParse', 'documentParse', 'tokenizer', 'fileHandler', 'path']
};

export {
    astBuilder
};