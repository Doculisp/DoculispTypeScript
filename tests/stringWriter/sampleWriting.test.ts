import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { Result } from "../../src/types/types.general";
import { buildPath, testable } from "../testHelpers";
import { containerPromise } from "../../src/moduleLoader";
import path from "path";

describe('stringWriter writing sample', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let toResult: (filePath: string) => Result<string> = null as any;
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

    beforeEach(async () => {
        let container = await containerPromise;
        workingDir = process.cwd();
        process.chdir('./tests/Sample/simple');
        toResult = function(pathString: string) {
            return testable.stringWriter.pathParser(container)(buildPath(pathString));
        };
    });

    afterEach(() => {
        process.chdir(workingDir);
        workingDir = process.cwd();
    });

    it('should write document.md', () => {
        process.chdir('./parsers/');

        const result = toResult('./document.md');
        verifyMarkdownResult(result);
    });

    it('should write the sample document', () => {
        const result = toResult('./_main.dlisp');
        verifyMarkdownResult(result);
        expect(process.cwd()).toBe(path.resolve('.'));
    });
});