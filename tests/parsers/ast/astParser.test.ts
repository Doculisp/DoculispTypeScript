import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { containerPromise } from "../../../src/moduleLoader";
import { IFailCode, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { TokenizedDocument } from "../../../src/types/types.tokens";
import { buildPath, buildProjectLocation, testable } from "../../testHelpers";
import { IAstParser, IAstEmpty, RootAst } from '../../../src/types/types.ast';
import { IPath, PathConstructor } from "../../../src/types/types.filePath";
import { IContainer } from "../../../src/types/types.containers";

describe('ast', () => {
    let container: IContainer = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let failCode: (message: string, location: { documentPath: IPath, line: number, char: number }) => IFailCode = undefined as any;
    let util: IUtil = undefined as any;
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<RootAst | IAstEmpty> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(async() => {
        container = await containerPromise;
        toResult = testable.ast.resultBuilder(container, environment => {
            util = environment.buildAs<IUtil>('util');
        });
        
        ok = util.ok;
        failCode = util.codeFailure;
    });

    describe('basic functionality', () => {
        let parser: IAstParser = undefined as any;

        beforeEach(() => {
            util = null as any;
            parser = testable.ast.parserBuilder(container, environment => {
                const pathHandler: PathConstructor = function (filePath): IPath {
                        return buildPath(filePath)
                };
                environment.replaceValue(pathHandler, 'pathConstructor');
                util = environment.buildAs<IUtil>('util');
            });
        });
    
        it('should return an empty doculisp if there was no tokens', () => {
            const tokens: Result<TokenizedDocument> = ok({
                projectLocation: buildProjectLocation('A:/empty/doc.md', 4, 10),
                tokens: []
            });
    
            const result = parser.parse(tokens);
    
            verifyAsJson(result);
        });

        it('should return failure if given failure', () => {
            const failure = failCode('this is a document failure', { documentPath: buildPath('Z:/mybad.dlisp'), line: 1, char: 1 });
    
            const result = parser.parse(failure);
    
            verifyAsJson(result);
        });
    
        it('should parse a text token', () => {
            const projectLocation = buildProjectLocation('T:/ext/only.md', 2, 9);
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
            const projectLocation = buildProjectLocation('T:/ext/only.md', 4, 8);
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
            const result = toResult(contents, buildProjectLocation('S:/ome/file.md',2, 1));
    
            verifyAsJson(result);
        });

        it('should parse a basic atom', () => {
            const text = '(content)';
            const result = toResult(text, buildProjectLocation('./_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should parse a container with a basic atom', () => {
            const text = '(section-meta (title))';
            const result = toResult(text, buildProjectLocation('./_main.dlisp', 1, 1));
            verifyAsJson(result);
        });

        it('should parse a container with a command', () => {
            const text = `
(section-meta
    (title Doculisp)
)
`;

            const result = toResult(text, buildProjectLocation('./_main.dlisp', 1, 6));
            verifyAsJson(result);
        });

        it('should parse a file with a get-path', () => {
            const text = `<!-- (dl
(section-meta
    (title Using Dynamic Path)
)
) -->

[back](<!-- (dl (get-path readme)) -->)
`;

            const result = toResult(text, buildProjectLocation('./_main.md', 1, 6));
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

            const result = toResult(text, buildProjectLocation('./_main.dlisp', 4, 7));

            verifyAsJson(result);
        });
    });
});