import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";
import { IVariableTable } from "../types/types.variableTable";
import { IPath } from "../types/types.filePath";
import { IProjectDocument } from "../types/types.astProject";
import { StringBuilderConstructor } from "../types/types.sringBuilder";
import { IDoculisp, IEmptyDoculisp } from "../types/types.astDoculisp";

type CompileResult = {
    compiled: IDoculisp | IEmptyDoculisp;
    destinationPath: IPath;
    id?: string | undefined;
    table: IVariableTable;
};

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter, variableTable: IVariableTable, stringBuilderConstructor: StringBuilderConstructor): IController {
    function _write(doculisp: Result<IDoculisp | IEmptyDoculisp>, destinationPath: IPath | false, variableTable: IVariableTable): Result<string | false> {
        const document = stringWrter.writeAst(doculisp, variableTable);

        if(!!destinationPath){
            const result = handler.write(destinationPath, document);

            if(!result.success) {
                return result;
            }
        } else if(!document.success) {
            return document;
        }

        return util.ok((destinationPath as IPath).fullName);
    }
    
    function _compile(sourcePath: IPath, destinationPath: IPath | false, variableTable: IVariableTable): Result<string | false> {
        const doculisp = astBuilder.parse(sourcePath, variableTable);
        
        return _write(doculisp, destinationPath, variableTable);
    }

    function _compileProject(sourcePath: IPath): Result<string>[] {
        const project = astBuilder.parseProject(sourcePath);

        if(!project.success) {
            return [project];
        }

        const compileResult: CompileResult[] = [];
        const results: Result<string>[] = [];

        for (let index = 0; index < project.value.documents.length; index++) {
            const document = project.value.documents[index] as IProjectDocument;
            if(document.id) {
                if(variableTable.hasKey(document.id)) {
                    results.push(util.fail(`Document id ('${document.id}') is a duplicate in project file '${sourcePath.fullName}'`, sourcePath));
                }
                else {
                    variableTable.addValue(document.id, { value: document.id, documentPath: document.destinationPath, type: 'variable-id' });
                }
            }

            const table = variableTable.createChild();
            const result = astBuilder.parse(document.sourcePath, table);
            if(!result.success) {
                results.push(result);
            }
            else {
                compileResult.push({
                    compiled: result.value,
                    destinationPath: document.destinationPath,
                    id: document.id,
                    table: table,
                });
            }
        }

        if(0 < results.length) {
            return results;
        }

        for (let index = 0; index < compileResult.length; index++) {
            const compiledDocument = compileResult[index] as CompileResult;
            const writeResult = _write(util.ok(compiledDocument.compiled), compiledDocument.destinationPath, compiledDocument.table);
            if(!writeResult.success) {
                results.push(writeResult);
            } else {
                results.push(util.ok(compiledDocument.destinationPath.fullName));
            }
        }

        return results;
    }

    function compile(sourcePath: IPath, destinationPath: IPath | false = false): Result<string>[] {
        if(sourcePath.extension !== '.dlproj' && !destinationPath) {
            return [util.fail(`Must have a destination file.`, sourcePath)];
        }

        if(sourcePath.extension === '.dlproj' && destinationPath) {
            return [util.fail('A project file cannot have a destination path', sourcePath)];
        }

        if(sourcePath.extension === '.dlproj') {
            return _compileProject(sourcePath);
        }

        return [_compile(sourcePath, destinationPath, variableTable) as Result<string>];
    }

    function test(sourcePath: IPath): Result<false>[] {
        return [_compile(sourcePath, false, variableTable) as Result<false>];
    }

    return {
        compile,
        test,
    };
}

const controllerBuilder: IRegisterable = {
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWriter: IStringWriter, variableTable: IVariableTable, stringBuilderConstructor: StringBuilderConstructor) => buildLoader(util, handler, astBuilder, stringWriter, variableTable, stringBuilderConstructor),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter', 'variableTable', 'stringBuilder'],
    singleton: true
};

export {
    controllerBuilder,
};
