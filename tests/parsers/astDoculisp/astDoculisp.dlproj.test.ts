import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { container } from "../../../src/container";
import { IDoculisp, IEmptyDoculisp } from '../../../src/types/types.astDoculisp'
import { IProjectLocation, Result } from "../../../src/types/types.general";
import { buildPath, buildProjectLocation, testable } from "../../testHelpers";
import { PathConstructor } from "../../../src/types/types.filePath";

describe.skip('astDoculisp project File', () => {
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        toResult = testable.doculisp.resultBuilder(container, environment => {
            const pathHandler: PathConstructor = 
                function(filePath) {
                    return buildPath(filePath);
            };
            environment.replaceValue(pathHandler, 'pathConstructor');
        });
    });

    it('should parse a single document file without document identifier', () => {
        const contents = `
(documents
    (document
        (source S:/ome/file.md)
        (output ./interesting.md)
    )
)
`;
        const result = toResult(contents, buildProjectLocation('S:/ome/file.md', 2, 1));

        verifyAsJson(result);
    });
});