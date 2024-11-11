import { ITestableContainer } from "../../src/types/types.containers";
import { IFileWriter } from "../../src/types/types.fileHandler";
import { IPath, PathConstructor } from "../../src/types/types.filePath";
import { IUtil, Result } from "../../src/types/types.general";
import { IIncludeBuilder } from "../../src/types/types.includeBuilder";
import { IDoculisp, IEmptyDoculisp } from "../../src/types/types.astDoculisp";
import { IVariableRetriever, IVariableSaver } from "../../src/types/types.variableTable";
import { IStringWriter } from "../../src/types/types.stringWriter";
import { IController } from "../../src/types/types.controller";

import { container } from "../../src/container";
import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../tools";
import path from "path";

type FileConfig = {
    outputPath?: IPath | undefined;
    fileText?: Result<string> | undefined;
    fileResult?: Result<string> | undefined;
};

type IncludeConfig = {
    sourcePath?: IPath | undefined;
    doculisp? : Result<IDoculisp | IEmptyDoculisp> | undefined;
    parseResult?: Result<IDoculisp | IEmptyDoculisp> | undefined;
};

type WriterConfig = {
    astMaybe?: Result<IDoculisp | IEmptyDoculisp> | undefined;
    writeResult?: Result<string> | undefined;
};

describe('controller', () => {
    const environment: ITestableContainer = container as ITestableContainer;
    
    let verifyAsJson: (data: any, options?: Options) => void;
    let testable: ITestableContainer = null as any;
    let util: IUtil;

    let fileConfig: FileConfig = undefined as any;
    let includeConfig: IncludeConfig = undefined as any;
    let writerConfig: WriterConfig = undefined as any;

    let pathConstructor: PathConstructor = undefined as any;
    let sut: IController = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });
    
    function getTestResult() {
        return {
            fileConfig,
            includeConfig,
            writerConfig,
        };
    }

    beforeEach(() =>{
        testable = environment.buildTestable();
        util = testable.buildAs<IUtil>('util');

        fileConfig = {};
        const fileWriter : IFileWriter = {
            write: function (path: IPath, text: Result<string>): Result<string> {
                fileConfig.outputPath = path;
                fileConfig.fileText = text;
                return fileConfig.fileResult ?? util.ok(path.fullName);
            }
        };
        environment.replaceValue(fileWriter, 'fileHandler')

        includeConfig = {};
        const emptyResult: IEmptyDoculisp = {
            type: "doculisp-empty"
        };

        const includeBuilder: IIncludeBuilder = {
            parse: function (path: IPath, _variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
                includeConfig.sourcePath = path;
                return includeConfig.parseResult ?? util.ok(emptyResult);
            },
            parseExternals: function (doculisp: Result<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
                includeConfig.doculisp = doculisp;
                return includeConfig.parseResult ?? util.ok(emptyResult);
            }
        };
        environment.replaceValue(includeBuilder, 'includeBuilder')

        writerConfig = {};
        const stringWriter: IStringWriter = {
            writeAst: function (astMaybe: Result<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableRetriever): Result<string> {
                writerConfig.astMaybe = astMaybe;
                return writerConfig.writeResult ?? util.ok('# Good Document #\n\nHello');
            }
        };
        environment.replaceValue(stringWriter, 'stringWriter');

        pathConstructor = function(pathString: string): IPath {
            const t: IPath = {
                extension: path.extname(pathString),
                getContainingDir: function (): IPath {
                    return pathConstructor("./");
                },
                getRelativeFrom: function (rootPath: IPath): string {
                    return "./"
                },
                type: "path",
                toJSON: function () {
                    return pathString;
                },
                fullName: pathString,
            };

            return t;
        };
        environment.replaceValue(pathConstructor, 'pathConstructor');

        sut = environment.buildAs<IController>('controller');
    });

    it('should test a markdown file to see if it will compile', () => {
        const sourcePath = pathConstructor('./someFile.md');
        sut.test(sourcePath);

        verifyAsJson(getTestResult());
    });
});