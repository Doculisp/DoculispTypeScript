import { IDictionary, ITestableContainer } from "../../src/types/types.containers";
import { IFileWriter } from "../../src/types/types.fileHandler";
import { IPath, PathConstructor } from "../../src/types/types.filePath";
import { IUtil, Result, ResultCode, ResultGeneral } from "../../src/types/types.general";
import { IIncludeBuilder } from "../../src/types/types.includeBuilder";
import { IDoculisp, IEmptyDoculisp } from "../../src/types/types.astDoculisp";
import { IVariablePath, IVariableTable, sourceKey } from "../../src/types/types.variableTable";
import { IStringWriter } from "../../src/types/types.stringWriter";
import { IController } from "../../src/types/types.controller";

import { containerPromise } from "../../src/moduleLoader";
import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../tools";
import path from "path";
import { IProjectDocuments } from "../../src/types/types.astProject";
import { buildPath } from "../testHelpers";

type FileConfig = {
    outputPath?: IPath | undefined;
    fileText?: ResultGeneral<string> | undefined;
    result?: ResultGeneral<string> | undefined;
};

type IncludeConfig = {
    sourcePath?: IPath | undefined;
    doculisp? : Result<IDoculisp | IEmptyDoculisp> | undefined;
    result?: Result<IDoculisp | IEmptyDoculisp> | undefined;
};

type WriterConfig = {
    astMaybe?: ResultCode<IDoculisp | IEmptyDoculisp> | undefined;
    result?: ResultCode<string> | undefined;
};

describe('controller',() => {
    let environment: ITestableContainer = null as any;
    
    let verifyAsJson: (data: any, options?: Options) => void;
    let testable: ITestableContainer = null as any;
    let util: IUtil;

    let fileConfig: FileConfig = undefined as any;
    let includeConfig: IncludeConfig = undefined as any;
    let writerConfig: WriterConfig = undefined as any;
    let table: IVariableTable = undefined as any;

    let pathConstructor: PathConstructor = undefined as any;
    let sut: IController = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });
    
    function getTestResult(finalResult: any = {}) {
        const result: IDictionary<any> = {};
        let cnt = 1;
        function add(name: string, value: any) {
            if(0 < Object.keys(value).length) {
                const index = `0${cnt} ${name}`;
                result[index] = value;
                cnt++;
            }
        }

        add('Parse Ast', includeConfig);
        add('Convert to Markdown', writerConfig);
        add('Write to File', fileConfig);
        add('Final Result', finalResult);

        return result;
    }

    beforeEach(async () =>{
        environment = await containerPromise as ITestableContainer;
        testable = environment.buildTestable();
        util = testable.buildAs<IUtil>('util');

        fileConfig = {};
        const fileWriter : IFileWriter = {
            write: function (path: IPath, text: ResultGeneral<string>): ResultGeneral<string> {
                fileConfig.outputPath = path;
                fileConfig.fileText = text;

                if(!text.success) {
                    return text;
                }

                return fileConfig.result ?? util.ok(path.fullName);
            }
        };
        testable.replaceValue(fileWriter, 'fileHandler')

        includeConfig = {};
        const emptyResult: IEmptyDoculisp = {
            type: "doculisp-empty"
        };

        const includeBuilder: IIncludeBuilder = {
            parse: function (variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp> {
                includeConfig.sourcePath = (
                    variableTable.hasKey(sourceKey) ?
                    (variableTable.getValue(sourceKey) as IVariablePath).value :
                    buildPath('path not provided', false)
                );
                return includeConfig.result ?? util.ok(emptyResult);
            },
            parseExternals: function (doculisp: Result<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp> {
                includeConfig.doculisp = doculisp;
                if (!doculisp.success) {
                    return doculisp;
                }

                return includeConfig.result ?? util.ok(emptyResult);
            },
            parseProject: function (path: IPath): Result<IProjectDocuments> {
                throw new Error("parseProject intentionally not implemented.");
            }
        };
        testable.replaceValue(includeBuilder, 'includeBuilder')

        writerConfig = {};
        const stringWriter: IStringWriter = {
            writeAst: function (astMaybe: ResultCode<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableTable): ResultCode<string> {
                writerConfig.astMaybe = astMaybe;
                if(!astMaybe.success) {
                    return astMaybe;
                }
                return writerConfig.result ?? util.ok('# Good Document #\n\nHello');
            }
        };
        testable.replaceValue(stringWriter, 'stringWriter');

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
        testable.replaceValue(pathConstructor, 'pathConstructor');

        table = testable.buildAs<IVariableTable>('variableTable').createChild();

        sut = testable.buildAs<IController>('controller');
    });

    describe('test', () => {
        it('should test handle a successful file', () => {
            const sourcePath = pathConstructor('./someFile.md');
            table.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
            sut.test(table);
    
            verifyAsJson(getTestResult());
        });
    
        it('should fail a file that cannot parse an ast', () => {
            const sourcePath = pathConstructor('./someFile.md');
            includeConfig.result = util.codeFailure('A bad parse', { documentPath: sourcePath, line: 1, char: 1 });
            table.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
            const result = sut.test(table);
    
            verifyAsJson(getTestResult(result));
        });
    
        it('should fail a file that cannot be converted to markdown', () => {
            const sourcePath = pathConstructor('./someFile.md');
            writerConfig.result = util.codeFailure('Unable to write', { documentPath: sourcePath, line: 1, char: 1 });
            table.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
            const result = sut.test(table);
    
            verifyAsJson(getTestResult(result));
        });
    });

    describe('compile', () => {
        it('should be successful if everything is successful', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            sut.compile(sourcePath, destinationPath);
    
            verifyAsJson(getTestResult());
        });

        it('should fail if a file cannot parse an ast', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            includeConfig.result = util.codeFailure('Unable to parse ast', { documentPath: sourcePath, line: 1, char: 1 });

            const result = sut.compile(sourcePath, destinationPath);

            verifyAsJson(getTestResult(result));
        });
    
        it('should fail a file that cannot be converted to markdown', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            writerConfig.result = util.codeFailure('Unable to write', { documentPath: sourcePath, line: 1, char: 1 });
            
            const result = sut.compile(sourcePath, destinationPath);
    
            verifyAsJson(getTestResult(result));
        });

        it('should fail if writing the file fails', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            fileConfig.result = util.generalFailure('Unable to write file', destinationPath);

            const result = sut.compile(sourcePath, destinationPath);

            verifyAsJson(getTestResult(result));
        });
    });
});