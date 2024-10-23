import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IUtil, Result } from "../../src/types/types.general";
import { testable } from "../testHelpers";
import { container } from "../../src/container";
import path from "path";
import { ITestableContainer } from "../../src/types/types.containers";
import { IVersion } from "../../src/types/types.version";

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

    beforeEach(() => {
        workingDir = process.cwd();
        process.chdir('./tests/Sample/simple');
        toResult = testable.stringWriter.pathParser(container, (environment: ITestableContainer) => {
            const util = environment.buildAs<IUtil>('util');

            const version: IVersion = {
                getVersion() {
                    return util.ok("1.2.3");
                },
            };

            environment.replaceValue(version, 'version');
        });
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