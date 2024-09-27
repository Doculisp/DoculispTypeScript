import { container } from "../../src/container";
import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../tools";
import { IDictionary, ITestableContainer } from "../../src/types.containers";
import { IDocWriter } from '../../src/types.docWriter';
import { IFail, ISuccess, IUtil, Result } from "../../src/types.general";
import { IAstBuilder } from "../../src/types.astBuilder";
import { IFileLoader } from "../../src/types.fileHandler";
import fs from 'fs';

// function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
//     return {
//         documentPath: path,
//         documentDepth: depth,
//         documentIndex: index,
//     };
// }

describe('docWriter', () => {
    let environment: ITestableContainer = undefined as any;
    let writer: IDocWriter = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    let util: IUtil = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let toCompiledResult : (path: string) => Result<string> = undefined as any;
    let fileReads: IDictionary<Result<string>> = undefined as any;

    function addFile(path: string, text: string): void {
        fileReads[path] = ok(text);
    }

    function addResult(path: string, text: Result<string>): void {
        fileReads[path] = text;
    }

    function loadFromDocumentation(name: string): Result<string> {
        const path = `./documentation/${name}`;
        try {
            const result = fs.readFileSync(path, { encoding: 'utf-8' });
            return ok(result);
        } catch (error) {
            return fail(`${error}`, path);
        }
    }

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        fileReads = {};

        util = environment.buildAs<IUtil>('util');
        ok = util.ok;
        fail = util.fail;

        const fileHandler: IFileLoader = {
            load(path: string) {
                const result = fileReads[path];
                if(result) {
                    return result;
                }

                return fail('Path is not setup', path);
            }
        }
        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', true);

        const builder = environment.buildAs<IAstBuilder>('astBuilder');

        writer = environment.buildAs<IDocWriter>('docWriter');

        toCompiledResult = function(path: string): Result<string> {
            const astResult = builder.parse(path);
            return writer.compile(astResult);
        }
    });

    describe('compile', () => {
        it('should return an error if given an error', () => {
            const expectedResult = fail('something went wrong', 'N:/o.md');
            const result = writer.compile(expectedResult);

            expect(result).toBe(expectedResult);
        });

        it('should compile an empty document', () => {
            const docPath = "./empty.md";
            const doc = '';

            addFile(docPath, doc);

            const result = toCompiledResult(docPath);
            verifyAsJson(result);
        });

        it('should compile a simple document', () => {
            const docPath = "./simple.md";
            const doc = `
<!--
(dl
    (section-meta
        (title Simple)
    )
)
-->

A few simple words.
`;

            addFile(docPath, doc);

            const result = toCompiledResult(docPath);
            verifyAsJson(result);
        });

        it('should compile a complicated', () => {
            const docPath = "./_main.md"

            addResult(docPath, loadFromDocumentation('comment.md'))

            const result = toCompiledResult(docPath);
            verifyAsJson(result);
        });
    });
});