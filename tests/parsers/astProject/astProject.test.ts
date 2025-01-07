import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../../tools";
import { buildPath, buildProjectLocation, testable } from "../../testHelpers";
import { IProjectDocuments, IProjectParser } from "../../../src/types/types.astProject";
import { IProjectLocation, IUtil, Result } from "../../../src/types/types.general";
import { IVariableTable } from "../../../src/types/types.variableTable";

describe('astProject', () => {
    let resultBuilder: (text: string, projectLocation: IProjectLocation) => Result<IProjectDocuments>;
    let verifyAsJson: (data: any, options?: Options) => void;
    let parser: IProjectParser;
    let util: IUtil;
    let variableTable: IVariableTable = null as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        resultBuilder = testable.project.resultBuilder(container, environment => {
            environment.replaceValue(buildPath, 'pathConstructor');
        });

        parser = testable.project.parseBuilder(container, environment => {
            util = environment.buildAs<IUtil>('util');
            variableTable = environment.buildAs<IVariableTable>('variableTable').createChild();
        });
    });

    it('should handle an empty project file', () => {
        const result = resultBuilder('', buildProjectLocation('./test.dlproj'));

        verifyAsJson(result);
    });

    it('should handle an empty documents block', () => {
        const result = resultBuilder('(documents)', buildProjectLocation('./test.dlproj'));

        verifyAsJson(result);
    });

    it('should return an error when given an error', () => {
        const tokenResults = util.fail('No good.');
        const result = parser.parse(tokenResults, variableTable);

        expect(result).toBe(tokenResults);
    });

    it('should enforce only a single documents block', () => {
        const project = `
(documents)
(documents)
`;

        const result = resultBuilder(project, buildProjectLocation('./myBad.dlproj'));

        verifyAsJson(result);
    });

    describe('basic project documents', () => {
        it('should parse a single document', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
        (output ./README.md)
    )
)
`;
            const result = resultBuilder(project, buildProjectLocation('./myProject.dlproj'));

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
            const result = resultBuilder(project, buildProjectLocation('./myProject.dlproj'));

            verifyAsJson(result);
        });

        it('should fail if document block is missing the source block', () => {
            const project = `
(documents
    (document
        (output ./README.md)
    )
)
`;

            const result = resultBuilder(project, buildProjectLocation('./project.dlproj'));

            verifyAsJson(result);
        });

        it('should fail if document block is missing the output block', () => {
            const project = `
(documents
    (document
        (source ./myReadme.md)
    )
)
`;

            const result = resultBuilder(project, buildProjectLocation('./project.dlproj'));

            verifyAsJson(result);
        });
    });

    describe('id project documents', () => {
        it('should parse a single document', () => {
            const project = `
(documents
    (document
        (readmeβ
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
)
`;

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it('should parse a two documents', () => {
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

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it('should parse a two documents one simple', () => {
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

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it('should fail if missing source', () => {
            const project = `
(documents
    (document
        (readme
            (output ../README.md)
        )
    )
)
`;

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it('should fail if missing output', () => {
            const project = `
(documents
    (document
        (readme
            (source ./_main.dlisp)
        )
    )
)
`;

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });
        
        it('should fail if identifier is not unique', () => {
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

            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));

            verifyAsJson(result);
        });

        it('should not parse a document with a capitalized id', () => {
            const project = `
(documents
    (document
        (Readme
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
)
`;
            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));
            verifyAsJson(result);
        });

        it('should not parse a document with an id that contains a symbol', () => {
            const project = `
(documents
    (document
        (readmeϐ
            (source ./_main.dlisp)
            (output ../README.md)
        )
    )
)
`;
            const result = resultBuilder(project, buildProjectLocation('/docs.dlproj'));
            verifyAsJson(result);
        });
    });
});