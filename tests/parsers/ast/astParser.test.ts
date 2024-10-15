import fs from 'fs';
import path from 'path';
import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { container } from "../../../src/container";
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { TokenizedDocument } from "../../../src/types/types.tokens";
import { buildLocation, testable } from "../../testHelpers";
import { IAstParser, IAstEmpty, RootAst } from '../../../src/types/types.ast';

describe('ast', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let util: IUtil = undefined as any;
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<RootAst | IAstEmpty> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        toResult = testable.ast.resultBuilder(container, environment => {
            util = environment.buildAs<IUtil>('util');
        });
        
        ok = util.ok;
        fail = util.fail;
    });

    describe('basic functionality', () => {
        let parser: IAstParser = undefined as any;

        beforeEach(() => {
            util = null as any;
            parser = testable.ast.parserBuilder(container, environment => {
                util = environment.buildAs<IUtil>('util');
            });
        });
    
        it('should return an empty doculisp if there was no tokens', () => {
            const tokens: Result<TokenizedDocument> = ok({
                projectLocation: buildLocation('A:/empty/doc.md', 4, 10),
                tokens: []
            });
    
            const result = parser.parse(tokens);
    
            verifyAsJson(result);
        });

        it('should return failure if given failure', () => {
            const failure = fail('this is a document failure', 'Z:/mybad.dlisp');
    
            const result = parser.parse(failure);
    
            verifyAsJson(result);
        });
    
        it('should parse a text token', () => {
            const projectLocation = buildLocation('T:/ext/only.md', 2, 9);
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
    
        it('should parse multiple text tokens', () => {
            const projectLocation = buildLocation('T:/ext/only.md', 4, 8);
            const tokens: Result<TokenizedDocument> = ok({
                projectLocation: projectLocation,
                tokens: [
                    {
                        type: 'token - text',
                        location: util.toLocation(projectLocation, 1, 1),
                        text: 'Intro text',
                    },
                    {
                        type: 'token - text',
                        location: util.toLocation(projectLocation, 5, 1),
                        text: 'Text after some comment',
                    }
                ],
            });
    
            const result = parser.parse(tokens);
    
            verifyAsJson(result);
        });
    });

    describe('lisp', () => {
        it('should simple lisp tokens', () => {
            const contents = `<!--
(dl (# My heading))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 2, 1));
    
            verifyAsJson(result);
        });

        it('should parse a basic atom', () => {
            const text = '(content)';
            const result = toResult(text, buildLocation('./_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should parse a container with a basic atom', () => {
            const text = '(section-meta (title))';
            const result = toResult(text, buildLocation('./_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should parse a container with a command', () => {
            const text = `
(section-meta
    (title Doculisp)
)
`;

            const result = toResult(text, buildLocation('./_main.dlisp', 1, 6));
            verifyAsJson(result);
        });

        it('should parse a document with all the parts', () => {
            const text = `
(section-meta
    (title Doculisp)
    (include
        (Section ./structure.md)
        (Section ./doculisp.md)
        (Section ./section-meta.md)
        (Section ./content.md)
        (Section ./headings.md)
        (Section ./comment.md)
        (Section ./keywords.md)
    )
)

(## An introduction to Doculisp)

(content (toc numbered-labeled))
`;

            const result = toResult(text, buildLocation('./_main.dlisp', 4, 7));

            verifyAsJson(result);
        });
    });

    describe.skip('parse its own documentation', () => {
        function getContents(fileName: string, depth: number, index: number): Result<RootAst | IAstEmpty> {
            const filePath = path.join('./documentation/', fileName);
            const location: IProjectLocation = buildLocation(filePath, depth, index);

            const content = fs.readFileSync(filePath, { encoding: 'utf8' });

            return toResult(content, location);
        }

        it.skip('should build ast for structure.md', () => {
            const result = getContents('structure.md', 2, 1);
            verifyAsJson(result);
        });

        it.skip('should build ast for doculisp.md', () => {
            const result = getContents('doculisp.md', 2, 2);
            verifyAsJson(result);
        });

        it.skip('should build ast for section-meta.md', () => {
            const result = getContents('section-meta.md', 2, 3);
            verifyAsJson(result);
        });

        it.skip('should build ast for content.md', () => {
            const result = getContents('content.md', 2, 4);
            verifyAsJson(result);
        });

        it.skip('should build ast for headings.md', () => {
            const result = getContents('headings.md', 2, 5);
            verifyAsJson(result);
        });

        it.skip('should build ast for comment.md', () => {
            const result = getContents('comment.md', 2, 6);
            verifyAsJson(result);
        });

        it.skip('should build ast for keywords.md', () => {
            const result = getContents('keywords.md', 2, 7);
            verifyAsJson(result);
        });

        it.skip('should build ast for contributors.md', () => {
            const result = getContents('contributors.md', 2, 8);
            verifyAsJson(result);
        });

        it.skip('should build ast for _main.md', () => {
            const result = getContents('_main.md', 1, 1);
            verifyAsJson(result);
        });
    });
});