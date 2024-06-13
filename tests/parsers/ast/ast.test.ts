import { Options } from "approvals/lib/Core/Options";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { container } from "../../../src/container";
import { ITestableContainer } from "../../../src/types.containers";
import { IAst, IAstParser } from '../../../src/types.ast'
import { IFail, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { TokenFunction, TokenizedDocument } from "../../../src/types.tokens";
import { DocumentParser } from "../../../src/types.document";

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
    let toResult: (text: string, projectLocation: IProjectLocation) => Result<IAst> = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        parser = environment.buildAs<IAstParser>('astParse');
        util = environment.buildAs<IUtil>('util');
        let document = environment.buildAs<DocumentParser>('documentParse');
        let tokenizer = environment.buildAs<TokenFunction>('tokenizer');

        toResult = (text: string, projectLocation: IProjectLocation) => {
            const docResult = document(text, projectLocation);
            const tokens = tokenizer(docResult);
            return parser.parse(tokens);
        };
        
        ok = util.ok;
        fail = util.fail;
    });

    describe('basic functionality', () => {
        test('should return failure if given failure', () => {
            const failure = fail('this is a document failure', 'Z:/mybad.dlisp');
    
            const result = parser.parse(failure);
    
            verifyAsJson(result);
        });
    
        test('should return an empty ast if there was no tokens', () => {
            const tokens: Result<TokenizedDocument> = ok({
                projectLocation: buildLocation('A:/empty/doc.md', 4, 10),
                tokens: []
            });
    
            const result = parser.parse(tokens);
    
            verifyAsJson(result);
        });
    
        test('should parse a text token', () => {
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
    
        test('should parse multiple text tokens', () => {
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
        test('should simple lisp tokens', () => {
            const contents = `<!--
(dl (# My heading))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 2, 1));
    
            verifyAsJson(result);
        });
    
        test('should not parse a bad header', () => {
            const contents = `<!--
(dl (#head My heading))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 3, 2));
    
            verifyAsJson(result);
        });
    
        test('should not parse a header without a parameter', () => {
            const contents = `<!--
(dl (#))
-->`;
            const result = toResult(contents, buildLocation('S:/ome/file.md', 2, 3));
    
            verifyAsJson(result);
        });

        describe('section-meta', () => {
            describe('title', () => {
                test('should parse a title', () => {
                    const contents = `
(section-meta
    (title My Cool Document)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 7));
            
                    verifyAsJson(result);
                });
            
                test('should not parse a title without a parameter', () => {
                    const contents = `
(section-meta
    (title)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
            
                    verifyAsJson(result);
                });

                test('should parse the link', () => {
                    const contents = `
(section-meta
    (title My cool title✨)
    (link my_cool_title)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                test('should parse the link if it comes before the title', () => {
                    const contents = `
(section-meta
    (link my_cool_title)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
        
                    verifyAsJson(result);
                });

                test('should not parse a link with no parameter', () => {
                    const contents = `
(section-meta
    (link)
    (title My cool title✨)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 3, 10));
                            
                    verifyAsJson(result);
                });

                test('should parse the subtitle command', () => {
                    const contents = `
(section-meta
    (title My cool title)
    (subtitle This is information)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 4, 4));
        
                    verifyAsJson(result);
                });

                test('should parse the subtitle before title command', () => {
                    const contents = `
(section-meta
    (subtitle This is information)
    (title My cool title)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 2, 7));
        
                    verifyAsJson(result);
                });

                test('should not parse a subtitle without a parameter', () => {
                    const contents = `
(section-meta
    (title My cool title)
    (subtitle)
)
`;
                    const result = toResult(contents, buildLocation('main.dlisp', 1, 10));
        
                    verifyAsJson(result);
                });
            });
        });
    });
});