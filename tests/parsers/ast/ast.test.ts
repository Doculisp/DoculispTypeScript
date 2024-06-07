import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { ITestableContainer } from "../../../src/types.containers";
import { IAstParser } from '../../../src/types.ast'
import { getVerifier } from "../../tools";
import { Options } from "approvals/lib/Core/Options";
import { fail } from "../../../src/types.general";

describe('ast', () => {
    let environment: ITestableContainer = undefined as any;
    let parser: IAstParser = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        parser = environment.buildAs<IAstParser>('astParse');
    });

    test('should return failure if given failure', () => {
        const failure = fail('this is a document failure', 'Z:/mybad.dlisp');

        const result = parser.parse(failure);

        verifyAsJson(result);
    });
});