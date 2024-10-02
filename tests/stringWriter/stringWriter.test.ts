import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IFail, IProjectLocation, IUtil } from "../../src/types.general";
import { Result } from "../../src/types.general";
import { buildLocation, testable } from "../testHelpers";
import { container } from "../../src/container";

describe('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let resultBuilder: (text: string, location: IProjectLocation) => Result<string> = null as any;
    // let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;

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
        // ok = null as any;
        fail = null as any;

        resultBuilder = testable.stringWriter.resultBuilder(container, environment => {
            const util: IUtil = environment.buildAs<IUtil>('util');
            // ok = util.ok;
            fail = util.fail;
        });
    });

    describe('basic functionality', () => {
        it('should not write an error', () => {
            const expectedResult = fail('Some failure', 'S:/ome/path.md');
            const writer = testable.stringWriter.writer(container);
            const result = writer.writeAst(expectedResult);

            expect(result).toBe(expectedResult);
        });
    });

    describe('writing markup', () => {
        describe('text block', () => {
            it('should successfully write an empty string', () => {
                const result = resultBuilder('', buildLocation('C:/my_document.md', 4, 8));

                verifyMarkdownResult(result);
            });

            it('should write a simple text of "hello"', () =>{
                const result = resultBuilder('hello', buildLocation('C:/my_document.md', 3, 6));

                verifyMarkdownResult(result);
            });

            it('should write text of "blow fish"', () => {
                const result = resultBuilder('blow fish', buildLocation('C:/my_document.md', 7, 2));

                verifyMarkdownResult(result);
            });
        });
    });
});