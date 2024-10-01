import path from 'path';
import fs from 'fs';
import { Options } from "approvals/lib/Core/Options";
import { IDictionary, ITestableContainer } from "../../../src/types.containers";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { IAst } from "../../../src/types.ast";
import { IAstBuilder } from "../../../src/types.astBuilder";
import { getVerifier } from "../../tools";
import { configure } from "approvals/lib/config";
import { container } from "../../../src/container";
import { IFileLoader } from "../../../src/types.fileHandler";
import { buildLocation, testable } from '../../testHelpers';

describe('astRecursiveBuilder', () => {
    // let environment: ITestableContainer = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    let util: IUtil = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;

    // let builder: IAstBuilder = undefined as any;
    let pathToResult: IDictionary<Result<string>> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    function setup(environment: ITestableContainer) {
        util = null as any;
        util = environment.buildAs<IUtil>('util');

        ok = util.ok;
        fail = util.fail;

        pathToResult = null as any;
        pathToResult = {};
        const fileHandler: IFileLoader = {
            load(filePath: string): Result<string> {
                const result = pathToResult[filePath];
                if(result) {
                    return result;
                }

                return util.fail(`filePath has not been setup.`, filePath);
            }
        };

        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', false);
    }

    describe('externalParse', () => {
        let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IAst> = undefined as any;

        beforeEach(() => {
            toExternalResult = testable.astRecursiveExternalResultBuilder(container, setup);
        });

        it('should handle an empty ast', () => {
            const result = toExternalResult("", buildLocation('C:/_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should return an error if given an error', () => {
            const builder: IAstBuilder = testable.astRecursiveParserBuilder(container, setup);

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
        (title A journey down a bad filePath)
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
        let toResult: (filePath: string) => Result<IAst> = undefined as any

        beforeEach(() => {
            toResult = testable.astRecursiveResultBuilder(container, setup);
        });

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

    describe('parseExternals recursive ast for own documents', () => {
        let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IAst> = undefined as any;
        beforeEach(() => {
            toExternalResult = testable.astRecursiveExternalResultBuilder(container, environment => {
                util = null as any;
                util = environment.buildAs<IUtil>('util');

                ok = util.ok;
                fail = util.fail;

                const fileHandler: IFileLoader = {
                    load(rawFilePath: string): Result<string> {
                        const filePath = path.join('./documentation/', rawFilePath);
                        return ok(fs.readFileSync(filePath, { encoding: 'utf8' }));
                    }
                };
                
                environment.replaceBuilder(() => fileHandler, [], 'fileHandler', false);
            });
        });

        function getContents(fileName: string, depth: number, index: number): Result<IAst> {
            const filePath = path.join('./documentation/', fileName);
            const location = buildLocation(filePath, depth, index);
            const content = fs.readFileSync(filePath, { encoding: 'utf8' });
            return toExternalResult(content, location);
        }

        it('should parse structure.md', () => {
            const result = getContents('structure.md', 2, 1);
            verifyAsJson(result);
        });

        it('should parse doculisp.md', () => {
            const result = getContents('doculisp.md', 2, 2);
            verifyAsJson(result);
        });

        it('should parse section-meta.md', () => {
            const result = getContents('section-meta.md', 2, 3);
            verifyAsJson(result);
        });

        it('should parse content.md', () => {
            const result = getContents('content.md', 2, 4);
            verifyAsJson(result);
        });

        it('should parse headings.md', () => {
            const result = getContents('headings.md', 2, 5);
            verifyAsJson(result);
        });

        it('should parse comment.md', () => {
            const result = getContents('comment.md', 2, 6);
            verifyAsJson(result);
        });

        it('should parse keywords.md', () => {
            const result = getContents('keywords.md', 2, 6);
            verifyAsJson(result);
        });

        it('should parse _main.dlisp', () => {
            const result = getContents('_main.dlisp', 1, 1);
            verifyAsJson(result);
        });
    });
});