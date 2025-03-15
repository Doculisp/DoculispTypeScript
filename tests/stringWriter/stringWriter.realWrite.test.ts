import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IProjectLocation, ISuccess, IUtil } from "../../src/types/types.general";
import { Result } from "../../src/types/types.general";
import { buildProjectLocation, testable, buildPath } from "../testHelpers";
import { IFileHandler } from "../../src/types/types.fileHandler";
import { container } from "../../src/container";
import { IVariableTestable } from "../../src/types/types.variableTable";
import { IPath } from "../../src/types/types.filePath";

describe('when writing', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let toResult: (text: string, location: IProjectLocation) => Result<string> = null as any;
    let fileHandler: IFileHandler = null as any;
    let variableTable: IVariableTestable = undefined as any;

    let workingDir: string = null as any;

    function verifyMarkdownResult(textMaybe: Result<string>, options?: Options): void {
        if(textMaybe.success) {
            verifyMarkdown(textMaybe.value, options);
        }
        else {
            verifyAsJson(textMaybe, options);
        }
    }

    beforeAll(() => {
        const verifiers =  getVerifiers(configure);
        verifyAsJson = verifiers.verifyAsJson;
        verifyMarkdown = verifiers.verifyMarkdown;
    });

    function changeDir(sampleName: string): void {
        process.chdir(`./tests/Sample/${sampleName}`);
    }

    function setupOutPut(outPutFileName: string): void {
        variableTable.addValue(' destination', { type: 'variable-path', value: buildPath(`./${outPutFileName}`) });
    }

    function loadFile(filePath: string): ISuccess<string> {
        return fileHandler.load(buildPath(filePath)) as ISuccess<string>;
    }

    beforeEach(() => {
        workingDir = process.cwd();
        toResult = testable.stringWriter.resultBuilder(container, environment => {
            const util: IUtil = environment.buildAs<IUtil>('util');
            variableTable = environment.buildAs<IVariableTestable>('variableTable');
            variableTable.addGlobalValue(' ID ', { type: 'variable-string', value: 'String Writer Test'});

            environment.replace({
                builder: () => variableTable,
                name: 'variableTable',
                singleton: true
            });

            fileHandler = environment.buildAs<IFileHandler>('fileHandler');
            const fakeFileHandler: IFileHandler = {
                load: function (path: IPath): Result<string> {
                    return fileHandler.load(path);
                },
                write: function (path: IPath, _text: Result<string>): Result<string> {
                    return util.ok(path.fullName);
                },
                getProcessWorkingDirectory: function (): Result<IPath> {
                    return fileHandler.getProcessWorkingDirectory();
                },
                setProcessWorkingDirectory: function (directory: IPath): Result<undefined> {
                    return fileHandler.setProcessWorkingDirectory(directory);
                }
            };

            environment.replaceValue(fakeFileHandler, 'fileHandler');
        });
    });

    afterEach(() => {
        process.chdir(workingDir);
    });
    
    describe.skip('a file with a bad link', () => {
        beforeEach(() => {
            changeDir('simpleBadLink');
            setupOutPut('readme.md');
        });

        it.skip('should return an error object', () => {

        });
    });

    describe('its own documentation', () => {
        beforeEach(() => {
            changeDir('complex');
            setupOutPut('readme.md');
        });

        it('should write the structure part of its own documentation', () => {
            const filePath = './lang/structure.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the doculisp part of its own documentation', () => {
            const filePath = './lang/doculisp.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the section-meta part of its own documentation', () => {
            process.chdir('./lang/section-meta');
            const filePath = './_main.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the content part of its own documentation', () => {
            const filePath = './lang/content.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the headings part of its own documentation', () => {
            const filePath = './lang/headings.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the comment part of its own documentation', () => {
            const filePath = './lang/comment.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the keywords part of its own documentation', () => {
            const filePath = './lang/keywords.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });

        it('should write the whole of its own documentation', () => {
            const filePath = './_main.md';
            const doc: Result<string> = loadFile(filePath);

            if(!doc.success) {
                expect(JSON.stringify(doc, null, 4)).toBe('');
            }

            const result = toResult(doc.value, buildProjectLocation(filePath, 1, 1));
            verifyMarkdownResult(result);
        });
    });
});
