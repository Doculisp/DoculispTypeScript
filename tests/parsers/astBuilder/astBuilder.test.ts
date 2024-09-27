import { Options } from "approvals/lib/Core/Options";
import { ITestableContainer } from "../../../src/types.containers";
import { IProjectLocation, Result } from "../../../src/types.general";
import { IAst, IAstParser } from "../../../src/types.ast";
import { IAstBuilder } from "../../../src/types.astBuilder";
import { getVerifier } from "../../tools";
import { configure } from "approvals/lib/config";
import { container } from "../../../src/container";
import { DocumentParser } from "../../../src/types.document";
import { TokenFunction } from "../../../src/types.tokens";

function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
    return {
        documentPath: path,
        documentDepth: depth,
        documentIndex: index,
    };
}

describe.skip('astRecursiveBuilder', () => {
    let environment: ITestableContainer = undefined as any;
    let builder: IAstBuilder = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    //let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    //let fail: (message: string, documentPath: string) => IFail = undefined as any;
    // let util: IUtil = undefined as any;
    let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IAst> = undefined as any;
    //let toResult: (target:Result<{text: string, projectLocation: IProjectLocation}>) => Result<IAst> = undefined as any

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        builder = environment.buildAs<IAstBuilder>('astBuilder');
        // util = environment.buildAs<IUtil>('util');
        let document = environment.buildAs<DocumentParser>('documentParse');
        let tokenizer = environment.buildAs<TokenFunction>('tokenizer');
        let astParser = environment.buildAs<IAstParser>('astParse');

        toExternalResult = (text: string, projectLocation: IProjectLocation) => {
            const docResult = document(text, projectLocation);
            const tokens = tokenizer(docResult);
            const ast = astParser.parse(tokens);
            return builder.parseExternals(ast);
        };

        // toResult = (target:Result<{text: string, projectLocation: IProjectLocation}>) => {
        //     return builder.parse(target);
        // };
        
        // ok = util.ok;
        // fail = util.fail;
    });

    describe('externalParse', () => {
        it('should handle an empty ast', () => {
            const result = toExternalResult("", buildLocation('C:/_main.dlisp', 1, 1));
            verifyAsJson(result);
        });
    });
});