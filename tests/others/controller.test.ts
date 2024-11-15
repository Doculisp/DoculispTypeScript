import { IDictionary, ITestableContainer } from "../../src/types/types.containers";
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
import { IProjectDocuments } from "../../src/types/types.astProject";

type FileConfig = {
    outputPath?: IPath | undefined;
    fileText?: Result<string> | undefined;
    result?: Result<string> | undefined;
};

type IncludeConfig = {
    sourcePath?: IPath | undefined;
    doculisp? : Result<IDoculisp | IEmptyDoculisp> | undefined;
    result?: Result<IDoculisp | IEmptyDoculisp> | undefined;
};

type WriterConfig = {
    astMaybe?: Result<IDoculisp | IEmptyDoculisp> | undefined;
    result?: Result<string> | undefined;
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

    beforeEach(() =>{
        testable = environment.buildTestable();
        util = testable.buildAs<IUtil>('util');

        fileConfig = {};
        const fileWriter : IFileWriter = {
            write: function (path: IPath, text: Result<string>): Result<string> {
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
            parse: function (path: IPath, _variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
                includeConfig.sourcePath = path;
                return includeConfig.result ?? util.ok(emptyResult);
            },
            parseExternals: function (doculisp: Result<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableSaver): Result<IDoculisp | IEmptyDoculisp> {
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
            writeAst: function (astMaybe: Result<IDoculisp | IEmptyDoculisp>, _variableTable: IVariableRetriever): Result<string> {
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

        sut = testable.buildAs<IController>('controller');
    });

    describe('test', () => {
        it('should test handle a successful file', () => {
            const sourcePath = pathConstructor('./someFile.md');
            sut.test(sourcePath);
    
            verifyAsJson(getTestResult());
        });
    
        it('should fail a file that cannot parse an ast', () => {
            const sourcePath = pathConstructor('./someFile.md');
            includeConfig.result = util.fail('A bad parse', sourcePath);
            const result = sut.test(sourcePath);
    
            verifyAsJson(getTestResult(result));
        });
    
        it('should fail a file that cannot be converted to markdown', () => {
            const sourcePath = pathConstructor('./someFile.md');
            writerConfig.result = util.fail('Unable to write', sourcePath);
            const result = sut.test(sourcePath);
    
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
            includeConfig.result = util.fail('Unable to parse ast', sourcePath);

            const result = sut.compile(sourcePath, destinationPath);

            verifyAsJson(getTestResult(result));
        });
    
        it('should fail a file that cannot be converted to markdown', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            writerConfig.result = util.fail('Unable to write', sourcePath);
            
            const result = sut.compile(sourcePath, destinationPath);
    
            verifyAsJson(getTestResult(result));
        });

        it('should fail if writing the file fails', () => {
            const sourcePath = pathConstructor('./someFile.md');
            const destinationPath = pathConstructor('./README.md');
            fileConfig.result = util.fail('Unable to write file', destinationPath);

            const result = sut.compile(sourcePath, destinationPath);

            verifyAsJson(getTestResult(result));
        });
    });
});