import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { ITestableContainer } from "../../../src/types.containers";
import { IAstParser } from '../../../src/types.ast'
import { getVerifier } from "../../tools";
import { Options } from "approvals/lib/Core/Options";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { TokenizedDocument } from "../../../src/types.tokens";

function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
    return {
        documentPath: path,
        documentDepth: depth,
        documentIndex: index,
    };
}

describe('ast', () => {
    let environment: ITestableContainer = undefined as any;
    let parser: IAstParser = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let util: IUtil = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        parser = environment.buildAs<IAstParser>('astParse');
        util = environment.buildAs<IUtil>('util');
        ok = util.ok;
        fail = util.fail;
    });

    test('should return failure if given failure', () => {
        const failure = fail('this is a document failure', 'Z:/mybad.dlisp');

        const result = parser.parse(failure);

        verifyAsJson(result);
    });

    test('should return an empty ast if there was no tokens', () => {
        const tokens: Result<TokenizedDocument> = ok({
            projectLocation: buildLocation('A:/empty/doc.md', 0, 0),
            tokens: []
        });

        const result = parser.parse(tokens);

        verifyAsJson(result);
    });

    test('should parse a text token', () => {
        const projectLocation = buildLocation('T:/ext/only.md', 0, 1);
        const tokens: Result<TokenizedDocument> = ok({
            projectLocation: projectLocation,
            tokens: [
                {
                    type: 'token - text',
                    location: util.toLocation(projectLocation, 2, 1),
                    text: 'Some text',
                }
            ],
        });

        const result = parser.parse(tokens);

        verifyAsJson(result);
    });
});