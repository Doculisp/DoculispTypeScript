import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IProjectLocation } from "../../src/types.general";
import { Result } from "../../src/types.general";
import { buildLocation, testable } from "../testHelpers";
import { container } from "../../src/container";

describe('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verify: (sut: any, options?: Options) => void;
    let resultBuilder: (text: string, location: IProjectLocation) => Result<string> = null as any;

    function verifyTextResult(textMaybe: Result<string>, options?: Options): void {
        if(textMaybe.success) {
            verify(textMaybe.value);
        }
        else {
            verifyAsJson(textMaybe);
        }
    }

    beforeAll(() => {
        const verifiers =  getVerifiers(configure);
        verifyAsJson = verifiers.verifyAsJson;
        verify = verifiers.verify;
    });

    beforeEach(() => {
        resultBuilder = testable.stringWriter.resultBuilder(container);
    });

    describe('writing markup', () => {
        describe('text block', () => {
            it('should successfully write an empty string', () => {
                const result = resultBuilder('', buildLocation('C:/my_document.md', 4, 8));

                verifyTextResult(result);
            });
        });
    });
});