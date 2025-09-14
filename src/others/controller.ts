import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";
import { destKey, IVariablePath, IVariableTable, sourceKey } from "../types/types.variableTable";
import { IPath } from "../types/types.filePath";
import { IProjectDocument } from "../types/types.astProject";
import { IDoculisp, IEmptyDoculisp } from "../types/types.astDoculisp";

type CompileResult = {
    compiled: IDoculisp | IEmptyDoculisp;
    destinationPath: IPath;
    id?: string | undefined;
    table: IVariableTable;
};

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter, variableTable: IVariableTable): IController {
    function _write(doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string | false> {
        const document = stringWrter.writeAst(doculisp, variableTable);

        const destinationPath = (
            variableTable.hasKey(destKey) ?
            (variableTable.getValue(destKey) as IVariablePath).value :
            false
        );

        if(!document.success) {
            return document;
        }

        if(destinationPath){
            const result = handler.write(destinationPath, document);

            if(!result.success) {
                return result;
            }

            return util.ok((destinationPath as IPath).fullName);
        } 
        
        return util.ok('Good');
    }
    
    function _compile(variableTable: IVariableTable): Result<string | false> {
        const doculisp = astBuilder.parse(variableTable);
        
        return _write(doculisp, variableTable);
    }

    function _compileProject(sourcePath: IPath): Result<string>[] {
        const project = astBuilder.parseProject(sourcePath, variableTable);

        if(!project.success) {
            return [project];
        }

        const compileResult: CompileResult[] = [];
        const results: Result<string>[] = [];

        for (let index = 0; index < project.value.documents.length; index++) {
            const document = project.value.documents[index] as IProjectDocument;

            const table = variableTable.createChild();
            table.addValue(sourceKey, { type: 'variable-path', value: document.sourcePath });
            table.addValue(destKey, { type: 'variable-path', value: document.destinationPath });
            
            if(!!document.id) {
                table.addGlobalValue(document.id, {
                    type: 'variable-id',
                    headerLinkText: false,
                    value: document.destinationPath,
                    source: document.location,
                });
            }

            const result = astBuilder.parse(table);
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
            const writeResult = _write(util.ok(compiledDocument.compiled), compiledDocument.table);
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

        variableTable.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
        if(destinationPath) {
            variableTable.addValue(destKey, { type: 'variable-path', value: destinationPath })
        }

        return [_compile(variableTable) as Result<string>];
    }

    function test(variableTable: IVariableTable): Result<string | false>[] {
        if(!variableTable.hasKey(sourceKey)) {
            return [util.fail('A source file must be given')];
        }

        const sourcePath = (variableTable.getValue(sourceKey) as IVariablePath).value;
        
        // Handle .dlproj files by testing project parsing without writing
        if(sourcePath.extension === '.dlproj') {
            return testProject(sourcePath);
        }

        return [_compile(variableTable) as Result<string | false>];
    }

    function testProject(sourcePath: IPath): Result<string | false>[] {
        const project = astBuilder.parseProject(sourcePath, variableTable);

        if(!project.success) {
            return [project as Result<string | false>];
        }

        const results: Result<string | false>[] = [];

        // Test parsing each document in the project without writing
        for (let index = 0; index < project.value.documents.length; index++) {
            const document = project.value.documents[index] as IProjectDocument;

            const table = variableTable.createChild();
            table.addValue(sourceKey, { type: 'variable-path', value: document.sourcePath });
            table.addValue(destKey, { type: 'variable-path', value: document.destinationPath });
            
            if(!!document.id) {
                table.addGlobalValue(document.id, {
                    type: 'variable-id',
                    headerLinkText: false,
                    value: document.destinationPath,
                    source: document.location,
                });
            }

            const result = astBuilder.parse(table);
            if(!result.success) {
                results.push(result as Result<string | false>);
            }
            else {
                // Test conversion to markdown without writing
                const writeResult = stringWrter.writeAst(util.ok(result.value), table);
                if(!writeResult.success) {
                    results.push(writeResult as Result<string | false>);
                } else {
                    // Return filename + "valid." instead of just false
                    results.push(util.ok(`${document.destinationPath.fullName} valid.`));
                }
            }
        }

        return results.length > 0 ? results : [util.ok(false)];
    }

    return {
        compile,
        test,
    };
}

const controllerBuilder: IRegisterable = {
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWriter: IStringWriter, variableTable: IVariableTable) => buildLoader(util, handler, astBuilder, stringWriter, variableTable),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter', 'variableTable'],
    singleton: true
};

export {
    controllerBuilder,
};
