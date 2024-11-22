import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";
import { IVariableRetriever, IVariableSaver } from "../types/types.variableTable";
import { IPath } from "../types/types.filePath";
import { IProjectDocument, IProjectParser } from "../types/types.astProject";
import { StringBuilderConstructor } from "../types/types.sringBuilder";

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver, astProjectParse: IProjectParser, stringBuilderConstructor: StringBuilderConstructor): IController {
    function _compile(sourcePath: IPath, destinationPath: IPath | false): Result<string | false> {
        const doculisp = astBuilder.parse(sourcePath, variableTable);
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

    function _compileProject(sourcePath: IPath): Result<string> {
        const project = astBuilder.parseProject(sourcePath);

        if(!project.success) {
            return project;
        }

        const sb = stringBuilderConstructor();
        sb.addLine();

        for (let index = 0; index < project.value.documents.length; index++) {
            const document = project.value.documents[index] as IProjectDocument;
            if(document.id) {
                variableTable.addValue(document.id, document.destinationPath);
            }

            const result = _compile(document.sourcePath, document.destinationPath)
            if(!result.success) {
                return result;
            }

            sb.addLine(`\t${document.destinationPath.fullName}`);
        }

        if(1 < sb.lineLength) {
            sb.addLine();
        }
        return util.ok(sb.toString());
    }

    function compile(sourcePath: IPath, destinationPath: IPath | false = false): Result<string> {
        if(sourcePath.extension !== '.dlproj' && !destinationPath) {
            return util.fail(`Must have a destination file.`, sourcePath);
        }

        if(sourcePath.extension === '.dlproj' && destinationPath) {
            return util.fail('A project file cannot have a destination path', sourcePath);
        }

        if(sourcePath.extension === '.dlproj') {
            return _compileProject(sourcePath);
        }

        return _compile(sourcePath, destinationPath) as Result<string>;
    }

    function test(sourcePath: IPath): Result<false> {
        return _compile(sourcePath, false) as Result<false>;
    }

    return {
        compile,
        test,
    };
}

const controllerBuilder: IRegisterable = {
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWriter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver, astProjectParse: IProjectParser, stringBuilderConstructor: StringBuilderConstructor) => buildLoader(util, handler, astBuilder, stringWriter, variableTable, astProjectParse, stringBuilderConstructor),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter', 'variableTable', 'astProjectParse', 'stringBuilder'],
    singleton: true
};

export {
    controllerBuilder,
};
