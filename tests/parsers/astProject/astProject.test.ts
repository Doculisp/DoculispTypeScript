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
        const result = parser('', buildProjectLocation('./test.dlproj'));

        verifyAsJson(result);
    });

    it('should handle an empty documents block', () => {
        const result = parser('(documents)', buildProjectLocation('./test.dlproj'));

        verifyAsJson(result);
    });

    describe('basic project documents', () => {
        it.skip('should parse a single document', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
        (output ./README.md)
    )
)
`;
            const result = parser(project, buildProjectLocation('./myProject.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should parse a two document', () => {
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
            const result = parser(project, buildProjectLocation('./myProject.dlproj'));

            verifyAsJson(result);
        });

        it.skip('should fail if document block is missing the source block', () => {
            const project = `
(documents
    (document
        (output ./README.md)
    )
)
`;

            const result = parser(project, buildProjectLocation('./project.dlproj'));

            verifyAsJson(result);
        });

        it.skip('should fail if document block is missing the output block', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
    )
)
`;

            const result = parser(project, buildProjectLocation('./project.dlproj'));

            verifyAsJson(result);
        });
    });

    describe('id project documents', () => {
        it.skip('should parse a single document', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should parse a two documents', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
    (document
        (contrib
            (source ./contrib/_main.dlisp)
            (output ../contrib.md)
        )
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should parse a two documents one simple', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
    (document
        (source ./contrib/_main.dlisp)
        (output ../contrib.md)
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should fail if missing source', () => {
            const project = `
(documents
    (document
        (readme
            (output ../README.md)
        )
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should fail if missing output', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
        )
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it.skip('should fail if identifier is not unique', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
    (document
        (readme
            (source ./contrib/_main.dlisp)
            (output ../contrib.md)
        )
    )
)
`;

            const result = parser(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
    });
});