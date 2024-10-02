import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../tools";
import { IProjectLocation } from "../../src/types.general";
import { Result } from "../../src/types.general";
import { buildLocation, testable } from "../testHelpers";
import { container } from "../../src/container";

describe('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let resultBuilder: (text: string, location: IProjectLocation) => Result<string> = null as any;

    function verifyTextResult(textMaybe: Result<string>, options?: Options): void {
        if(textMaybe.success) {
            verifyAsJson(textMaybe.value);
        }
        else {
            verifyAsJson(textMaybe);
        }
    }

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
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