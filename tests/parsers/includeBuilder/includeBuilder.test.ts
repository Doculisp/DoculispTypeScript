import { Options } from "approvals/lib/Core/Options";
import { IContainer, IDictionary, ITestableContainer } from "../../../src/types/types.containers";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { IDoculisp, IEmptyDoculisp } from "../../../src/types/types.astDoculisp";
import { IIncludeBuilder } from "../../../src/types/types.includeBuilder";
import { getVerifier } from "../../tools";
import { configure } from "approvals/lib/config";
import { containerPromise } from "../../../src/moduleLoader";
import { IDirectoryHandler, IFileLoader } from "../../../src/types/types.fileHandler";
import { buildProjectLocation, buildPath, testable } from '../../testHelpers';
import { IVariableTestable } from '../../../src/types/types.variableTable';
import { IPath } from '../../../src/types/types.filePath';

describe('includeBuilder', () => {
    let verifyAsJson: (data: any, options?: Options) => void;

    let container: IContainer = null as any;
    let util: IUtil = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath?: IPath) => IFail = undefined as any;
    let addPathResult: (filePath: string, result: Result<string>) => void = undefined as any;
    let variableSaver: IVariableTestable = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    function setup(environment: ITestableContainer) {
        util = null as any;
        util = environment.buildAs<IUtil>('util');

        variableSaver = environment.buildAs<IVariableTestable>('variableTable');
        variableSaver.clear();

        ok = util.ok;
        fail = util.fail;

        let pathToResult: IDictionary<Result<string>> = undefined as any;
        pathToResult = null as any;
        pathToResult = {};
        addPathResult = (filePath: string, result: Result<string>): void => {
            pathToResult[filePath] = result;
        }
        const fileHandler: IFileLoader & IDirectoryHandler = {
            load(filePath: IPath): Result<string> {
                const result = pathToResult[filePath.fullName];
                if(result) {
                    return result;
                }

                return util.fail(`filePath has not been setup.`, filePath);
            },
            getProcessWorkingDirectory(): Result<IPath> { return util.ok(buildPath('./', false)); },
            setProcessWorkingDirectory(): Result<undefined> { return util.ok(undefined); },
        };

        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', false);
        environment.replaceValue(buildPath, 'pathConstructor');
    }

    describe('includeParse', () => {
        let toExternalResult: (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> = undefined as any;

        beforeEach(async () => {
            container = await containerPromise;
            toExternalResult = testable.include.includeResultBuilder(container, setup);
        });

        it('should handle an empty ast', () => {
            const result = toExternalResult("", buildProjectLocation('C:/_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should return an error if given an error', () => {
            const builder: IIncludeBuilder = testable.include.parserBuilder(container, setup);

            const expectedResult = fail('This is a failure',  buildPath('M:/y/pah.md'));
            expect(builder.parseExternals(expectedResult, variableSaver)).toBe(expectedResult);
        });

        it('should return an error if there is a file error', () => {
            const badPath = buildPath('B:/add.md');
            const expectedResult = fail('baad file error', badPath);
            addPathResult(badPath.fullName, expectedResult);

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

            const result = toExternalResult(doc, buildProjectLocation('C:/_main.md', 1, 1));
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

            verifyAsJson(toExternalResult(document, buildProjectLocation('C:/_main.dlisp', 1, 1)));
        });

        it('should not an included document not a markdown or dlisp', () =>{
            const subDocument = `<h1>Hello World</h1>`;
            const subDocumentPath = 'C:/sub.docx';

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

            verifyAsJson(toExternalResult(document, buildProjectLocation('C:/_main.dlisp', 1, 1)));
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

            const result = toExternalResult(doc, buildProjectLocation('_main.dlisp', 1, 1));
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

            const result = toExternalResult(doc, buildProjectLocation('_main.md', 1, 1));
            verifyAsJson(result);
        });
    });

    describe('parse', () => {
        let toResult: (filePath: string) => Result<IDoculisp | IEmptyDoculisp> = undefined as any

        beforeEach(() => {
            const builder = testable.include.resultBuilder(container, setup);
            toResult = (filePath) => builder(buildPath(filePath));
        });

        it('should return file error if there is one', () => {
            const docPath = 'C:/bad.md';

            const expectedResult = fail('baad file', buildPath(docPath));

            addPathResult(docPath, expectedResult);

            const result = toResult(docPath);
            expect(result).toBe(expectedResult);
        });

        it('should parse an empty file', () => {
            const doc = '';
            const docPath = 'empty.md';
            
            addPathResult(docPath, ok(doc));

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
});