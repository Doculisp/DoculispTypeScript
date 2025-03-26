import { containerPromise } from "../../../src/moduleLoader";
import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../../tools";
import { DocumentParser } from "../../../src/types/types.document";
import { buildProjectLocation, testable } from "../../testHelpers";

describe('document parse dlproj file', () => {
    let parse: DocumentParser = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(async () => {
        let container = await containerPromise;
        parse = testable.document.resultBuilder(container);
    });

    it('should handle a project file with a single document', () => {
        let dlisp = `
(documents
    (document
        (source C:/main.dlisp)
        (output ./project.md)
    )
)
`;

        let result = parse(dlisp, buildProjectLocation('C:/build.dlisp', 7, 1));

        verifyAsJson(result);
    });
});