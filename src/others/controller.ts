import { IIncludeBuilder } from "../types/types.includeBuilder";
import { IRegisterable } from "../types/types.containers";
import { IController } from "../types/types.controller";
import { IFileWriter } from "../types/types.fileHandler";
import { IUtil, Result } from "../types/types.general";
import { IStringWriter } from "../types/types.stringWriter";

function buildLoader(util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter): IController {
    function _compile(sourcePath: string, destinationPath: string | false): Result<string | false> {
        const doculisp = astBuilder.parse(sourcePath);
        const document = stringWrter.writeAst(doculisp);

        if(!!destinationPath){
            const result = handler.write(destinationPath, document);

            if(!result.success) {
                return result;
            }
        } else if(!document.success) {
            return document;
        }

        return util.ok(destinationPath);
    }

    function compile(sourcePath: string, destinationPath: string): Result<string> {
        return _compile(sourcePath, destinationPath) as Result<string>;
    }

    function test(sourcePath: string): Result<false> {
        return _compile(sourcePath, false) as Result<false>;
    }

    return {
        compile,
        test,
    };
}

const controllerBuilder: IRegisterable = {
    builder: (util: IUtil, handler: IFileWriter, astBuilder: IIncludeBuilder, stringWrter: IStringWriter) => buildLoader(util, handler, astBuilder, stringWrter),
    name: 'controller',
    dependencies: ['util', 'fileHandler', 'includeBuilder', 'stringWriter'],
    singleton: true
};

export {
    controllerBuilder,
};
