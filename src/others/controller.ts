import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";
import { IVariableRetriever, IVariableSaver } from "../types/types.variableTable";
import { IPath, PathConstructor } from "../types/types.filePath";

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver, pathConstructor: PathConstructor): IController {
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

    function compile(sourcePath: string, destinationPath: string): Result<string> {
        const source: IPath = pathConstructor(sourcePath);
        const destination: IPath = pathConstructor(destinationPath);
        return _compile(source, destination) as Result<string>;
    }

    function test(sourcePath: string): Result<false> {
        const source: IPath = pathConstructor(sourcePath);
        return _compile(source, false) as Result<false>;
    }

    return {
        compile,
        test,
    };
}

const controllerBuilder: IRegisterable = {
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWriter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver, pathConstructor: PathConstructor) => buildLoader(util, handler, astBuilder, stringWriter, variableTable, pathConstructor),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter', 'variableTable', 'pathConstructor'],
    singleton: true
};

export {
    controllerBuilder,
};
