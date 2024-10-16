import fs from 'fs';
import path from 'path';
import { Options } from "approvals/lib/Core/Options";
import { IDictionary, ITestableContainer } from "../../../src/types/types.containers";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { IDoculisp, IEmptyDoculisp } from "../../../src/types/types.astDoculisp";
import { IIncludeBuilder } from "../../../src/types/types.includeBuilder";
import { getVerifier } from "../../tools";
import { configure } from "approvals/lib/config";
import { container } from "../../../src/container";
import { IDirectoryHandler, IFileLoader } from "../../../src/types/types.fileHandler";
import { buildLocation, testable } from '../../testHelpers';

describe.skip('includeBuilder', () => {
    let verifyAsJson: (data: any, options?: Options) => void;

    let util: IUtil = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let addPathResult: (filePath: string, result: Result<string>) => void = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    function setup(environment: ITestableContainer) {
        util = null as any;
        util = environment.buildAs<IUtil>('util');

        ok = util.ok;
        fail = util.fail;

        let pathToResult: IDictionary<Result<string>> = undefined as any;
        pathToResult = null as any;
        pathToResult = {};
        addPathResult = (filePath: string, result: Result<string>): void => {
            pathToResult[path.basename(filePath)] = result;
        }
        const fileHandler: IFileLoader & IDirectoryHandler = {
            load(filePath: string): Result<string> {
                const result = pathToResult[filePath];
                if(result) {
                    return result;
                }

                return util.fail(`filePath has not been setup.`, filePath);
            },
            getProcessWorkingDirectory(): string { return './'},
            setProcessWorkingDirectory(): void {},
        };

        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', false);
    }

    describe.skip('externalParse', () => {
        let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;

        beforeEach(() => {
            toExternalResult = testable.include.includeResultBuilder(container, setup);
        });

        it.skip('should handle an empty ast', () => {
            const result = toExternalResult("", buildLocation('C:/_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it.skip('should return an error if given an error', () => {
            const builder: IIncludeBuilder = testable.include.parserBuilder(container, setup);

            const expectedResult = fail('This is a failure', 'M:/y/pah.md');
            expect(builder.parseExternals(expectedResult)).toBe(expectedResult);
        });

        it.skip('should return an error if there is a file error', () => {
            const badPath = 'B:/add.md';
            const expectedResult = fail('baad file error', badPath);
            addPathResult(badPath, expectedResult);

            const doc = `<!--
(dl
    (section-meta
        (title A journey down a bad filePath)
        (include
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

        it.skip('should parse one included document', () =>{
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

            addPathResult(subDocumentPath, ok(subDocument));

            const document = `
(section-meta
    (title Main Document)
    (include
        (Section ${subDocumentPath})
    )
)

(content (toc numbered-labeled))
`;

            verifyAsJson(toExternalResult(document, buildLocation('C:/_main.dlisp', 1, 1)));
        });

        it.skip('should parse two sub documents', () => {
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

            addPathResult(subAPath, ok(subA));
            addPathResult(subBPath, ok(subB));

            const doc = `
(section-meta
    (title Main Multiple Sub Documents)
    (include
        (Section ${subAPath})
        (Section ${subBPath})
    )
)

(content)
`;

            const result = toExternalResult(doc, buildLocation('_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it.skip('should parse a sub document containing a sub document', () => {
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
        (include
            (GrandChild ${grandChildPath})
        )
    )
)
-->

Hi Dad!

(content)
`;
            const childPath = './child.md';

            addPathResult(grandChildPath, ok(grandChildDocument));
            addPathResult(childPath, ok(childDoc));

            const doc = `<!--
(dl
    (section-meta
        (title Top Level Document)
        (include
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

    describe.skip('parse', () => {
        let toResult: (filePath: string) => Result<IDoculisp | IEmptyDoculisp> = undefined as any

        beforeEach(() => {
            toResult = testable.include.resultBuilder(container, setup);
        });

        it.skip('should return file error if there is one', () => {
            const docPath = 'C:/bad.md';

            const expectedResult = fail('baad file', docPath);

            addPathResult(docPath, expectedResult);

            const result = toResult(docPath);
            expect(result).toBe(expectedResult);
        });

        it.skip('should parse an empty file', () => {
            const doc = '';
            const docPath = 'empty.md';
            
            addPathResult(docPath, ok(doc));

            const result = toResult(docPath);
            verifyAsJson(result);
        });

        it.skip('should parse a document with a child and grand child', () => {
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
        (include
            (Chip ${grandChildPath})
        )
    )
)
-->
hello from the child

<!-- (dl (content)) -->
`;

            addPathResult(grandChildPath, ok(grandchild));
            addPathResult(childPath, ok(child));

            const docPath = './_main.dlisp';
            const doc = `
(section-meta
    (title The True Root)
    (include
        (Block ${childPath})
    )
)

(content (toc))
`;

            addPathResult(docPath, ok(doc));

            const result = toResult(docPath);

            verifyAsJson(result);
        });
    });

    describe.skip('parseExternals recursive ast for own documents', () => {
        let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;
        let workingDir: string = null as any;
        beforeEach(() => {
            workingDir = process.cwd();
            process.chdir('./documentation');
            toExternalResult = testable.include.includeResultBuilder(container, environment => {
                util = null as any;
                util = environment.buildAs<IUtil>('util');

                ok = util.ok;
                fail = util.fail;
            });
        });

        afterEach(() => {
            process.chdir(workingDir);
        });

        function getContents(fileName: string, depth: number, index: number): Result<IDoculisp | IEmptyDoculisp> {
            const filePath = fileName;
            const location = buildLocation(filePath, depth, index);
            const content = fs.readFileSync(filePath, { encoding: 'utf8' });
            return toExternalResult(content, location);
        }

        it.skip('should parse structure.md', () => {
            const result = getContents('structure.md', 2, 1);
            verifyAsJson(result);
        });

        it.skip('should parse doculisp.md', () => {
            const result = getContents('doculisp.md', 2, 2);
            verifyAsJson(result);
        });

        it.skip('should parse section-meta.md', () => {
            const result = getContents('section-meta.md', 2, 3);
            verifyAsJson(result);
        });

        it.skip('should parse content.md', () => {
            const result = getContents('content.md', 2, 4);
            verifyAsJson(result);
        });

        it.skip('should parse headings.md', () => {
            const result = getContents('headings.md', 2, 5);
            verifyAsJson(result);
        });

        it.skip('should parse comment.md', () => {
            const result = getContents('comment.md', 2, 6);
            verifyAsJson(result);
        });

        it.skip('should parse keywords.md', () => {
            const result = getContents('keywords.md', 2, 6);
            verifyAsJson(result);
        });

        it.skip('should parse _main.md', () => {
            const result = getContents('_main.md', 1, 1);
            verifyAsJson(result);
        });
    });
});