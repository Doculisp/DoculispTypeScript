import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";
import { IVariableRetriever, IVariableSaver } from "../types/types.variableTable";
import { IPath } from "../types/types.filePath";

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver): IController {
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

    function compile(sourcePath: IPath, destinationPath: IPath): Result<string> {
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
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWriter: IStringWriter, variableTable: IVariableRetriever & IVariableSaver) => buildLoader(util, handler, astBuilder, stringWriter, variableTable),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter', 'variableTable'],
    singleton: true
};

export {
    controllerBuilder,
};
