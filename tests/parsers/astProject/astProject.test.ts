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

    it('should handle an empty documents block', () => {
        const result = parser('(documents)', buildProjectLocation('./test.dlproj', 1, 1));

        verifyAsJson(result);
    });

    describe.skip('basic project documents', () => {
        it('should parse a single document', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
        (output ./README.md)
    )
)
`;
            const result = parser(project, buildProjectLocation('./myProject.dlproj', 1, 1));

            verifyAsJson(result);
        });
        
        it('should parse a two document', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
        (output ./README.md)
    )
    (document
        (source ./howTo.md)
        (output ./contrib.md)
    )
)
`;
            const result = parser(project, buildProjectLocation('./myProject.dlproj', 1, 1));

            verifyAsJson(result);
        });
    });
});