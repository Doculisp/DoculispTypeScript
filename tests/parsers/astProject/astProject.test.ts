import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../../tools";
import { buildProjectLocation, testable } from "../../testHelpers";
import { IProjectDocuments } from "../../../src/types/types.astProject";
import { IProjectLocation, Result } from "../../../src/types/types.general";

describe('astProject', () => {
    let parser: (text: string, projectLocation: IProjectLocation) => Result<IProjectDocuments>;
    let verifyAsJson: (data: any, options?: Options) => void;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        parser = testable.project.resultBuilder(container);
    });

    it('should handle an empty project file', () => {
        const result = parser('', buildProjectLocation('./test.dlproj', 1, 1));

        verifyAsJson(result);
    });
});