import { Options } from "approvals/lib/Core/Options";
import { IDictionary, ITestableContainer } from "../../../src/types.containers";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { IAst, IAstParser } from "../../../src/types.ast";
import { IAstBuilder } from "../../../src/types.astBuilder";
import { getVerifier } from "../../tools";
import { configure } from "approvals/lib/config";
import { container } from "../../../src/container";
import { DocumentParser } from "../../../src/types.document";
import { TokenFunction } from "../../../src/types.tokens";
import { IFileLoader } from "../../../src/types.fileHandler";

function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
    return {
        documentPath: path,
        documentDepth: depth,
        documentIndex: index,
    };
}

describe('astRecursiveBuilder', () => {
    let environment: ITestableContainer = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    let util: IUtil = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;

    let builder: IAstBuilder = undefined as any;
    let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IAst> = undefined as any;
    let toResult: (path: string) => Result<IAst> = undefined as any
    let pathToResult: IDictionary<Result<string>> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        
        util = environment.buildAs<IUtil>('util');
        ok = util.ok;
        fail = util.fail;

        pathToResult = {};
        const fileHandler: IFileLoader = {
            load(path: string): Result<string> {
                const result = pathToResult[path];
                if(result) {
                    return result;
                }

                return util.fail(`path has not been setup.`, path);
            }
        };

        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', true);

        builder = environment.buildAs<IAstBuilder>('astBuilder');
        let document = environment.buildAs<DocumentParser>('documentParse');
        let tokenizer = environment.buildAs<TokenFunction>('tokenizer');
        let astParser = environment.buildAs<IAstParser>('astParse');

        toExternalResult = (text: string, projectLocation: IProjectLocation) => {
            const docResult = document(text, projectLocation);
            const tokens = tokenizer(docResult);
            const ast = astParser.parse(tokens);
            return builder.parseExternals(ast);
        };

        toResult = (path: string) => {
            return builder.parse(path);
        };
    });

    describe('externalParse', () => {
        it('should handle an empty ast', () => {
            const result = toExternalResult("", buildLocation('C:/_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should return an error if given an error', () => {
            const expectedResult = fail('This is a failure', 'M:/y/pah.md');
            expect(builder.parseExternals(expectedResult)).toBe(expectedResult);
        });

        it('should return an error if there is a file error', () => {
            const badPath = 'B:/add.md';
            const expectedResult = fail('baad file error', badPath);
            pathToResult[badPath] = expectedResult;

            const doc = `<!--
(dl
    (section-meta
        (title A journey down a bad path)
        (external
            (Section ${badPath})
        )
    )
)
-->

(content)
`;

            const result = toExternalResult(doc, buildLocation('C:/_main.md', 1, 1));
            expect(result).toBe(expectedResult);
        });

        it('should parse one included document', () =>{
            const subDocument = `<!--
(dl
    (section-meta
        (title Fist Sub-Document)
    )
)
-->

Hello world!
`;
            const subDocumentPath = 'C:/sub.md';

            pathToResult[subDocumentPath] = ok(subDocument);

            const document = `
(section-meta
    (title Main Document)
    (external
        (Section ${subDocumentPath})
    )
)

(content (toc numbered-labeled))
`;

            verifyAsJson(toExternalResult(document, buildLocation('C:/_main.dlisp', 1, 1)));
        });

        it('should parse two sub documents', () => {
            const subA = `<!--
(dl
    (section-meta
        (title Sub A)
    )
)
-->

Sub document A text.
`;

            const subAPath = 'A:/subA.md';

            const subB = `<!--
(dl
    (section-meta
        (title Sub B)
    )
)
-->

Sub document B text.
`;
            const subBPath = 'B:/subB.md';

            pathToResult[subAPath] = ok(subA);
            pathToResult[subBPath] = ok(subB);

            const doc = `
(section-meta
    (title Main Multiple Sub Documents)
    (external
        (Section ${subAPath})
        (Section ${subBPath})
    )
)

(content)
`;

            const result = toExternalResult(doc, buildLocation('_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should parse a sub document containing a sub document', () => {
            const grandChildDocument = `<!--
(dl
    (section-meta
        (title A Grandchild Document)
    )
)
-->

Hi gramps!
`;
            const grandChildPath = 'C:/grand.md';

            const childDoc = `<!--
(dl
    (section-meta
        (title A Child Document)
        (external
            (GrandChild ${grandChildPath})
        )
    )
)
-->

Hi Dad!

(content)
`;
            const childPath = './child.md';

            pathToResult[grandChildPath] = ok(grandChildDocument);
            pathToResult[childPath] = ok(childDoc);

            const doc = `<!--
(dl
    (section-meta
        (title Top Level Document)
        (external
            (Child ${childPath})
        )
    )
)
-->
Hello World!

(content)
`;

            const result = toExternalResult(doc, buildLocation('_main.md', 1, 1));
            verifyAsJson(result);
        });
    });

    describe('parse', () => {
        it('should return file error if there is one', () => {
            const docPath = 'C:/bad.md';

            const expectedResult = fail('baad file', docPath);

            pathToResult[docPath] = expectedResult;

            const result = toResult(docPath);
            expect(result).toBe(expectedResult);
        });

        it('should parse an empty file', () => {
            const doc = '';
            const docPath = 'empty.md';
            
            pathToResult[docPath] = ok(doc);

            const result = toResult(docPath);
            verifyAsJson(result);
        });

        it('should parse a document with a child and grand child', () => {
            const grandChildPath = './grandchild.md'
            const grandchild = `
<!--
(dl
    (section-meta
        (title The GRoot of all Docs)
    )
)
-->

Hello from the grand child
`;

            const childPath = './childDoc.md'
            const child = `
<!--
(dl
    (section-meta
        (title The Child to Bare)
        (external
            (Chip ${grandChildPath})
        )
    )
)
-->
hello from the child

<!-- (dl (content)) -->
`;

            pathToResult[grandChildPath] = ok(grandchild);
            pathToResult[childPath] = ok(child);

            const docPath = './_main.dlisp';
            const doc = `
(section-meta
    (title The True Root)
    (external
        (Block ${childPath})
    )
)

(content (toc))
`;

            pathToResult[docPath] = ok(doc);

            const result = toResult(docPath);

            verifyAsJson(result);
        });
    });
});