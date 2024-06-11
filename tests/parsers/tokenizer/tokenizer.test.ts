import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { Options } from "approvals/lib/Core/Options";
import { ITestableContainer } from "../../../src/types.containers";
import { TokenFunction } from '../../../src/types.tokens';
import { IFail, ILocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { DocumentMap } from "../../../src/types.document";

describe('tokenizer', () => {
    let environment: ITestableContainer = undefined as any;
    let tokenizer: TokenFunction = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let util: IUtil = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        environment = container.buildTestable();
        tokenizer = environment.buildAs<TokenFunction>('tokenizer');
        util = environment.buildAs<IUtil>('util');
        ok = util.ok;
        fail = util.fail;
    });

    test('should fail if document parsing failed', () => {
        const parseResult = fail('This document did not parse', 'X:/non-exist.dlisp') as Result<DocumentMap>;

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    test('should return empty if given an empty parse result', () => {
        const parseResult: Result<DocumentMap> = ok({
            projectLocation: { documentPath: 'c:/empty/readme.md', documentDepth: 0, documentIndex: 0 },
            parts: [],
        });

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    test('should tokenize text as text', () => {
        const parseResult: Result<DocumentMap> = ok({
            projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
            parts: [
                {
                    type: 'text',
                    text: 'hello my text',
                    location: util.location('D:/comments/simple.md', 0, 0, 5, 23),
                }
            ],
        });

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    describe('handling Doculisp', () => {
        test('should tokenize an empty comment', () => {
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(*)',
                        location: util.location('D:/comments/simple.md', 0, 0, 2, 1),
                    },
                ],
            });
            
            let result = tokenizer(parseResult);

            verifyAsJson(result);
        });
        
        test('should tokenize an single atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(atom)',
                        location: start,
                    },
                ],
            });
            
            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
        
        test('should tokenize an single atom with space after atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(atom )',
                        location: start,
                    },
                ],
            });
            
            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
        
        test('should tokenize an single atom with new line after atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(atom\r\n)',
                        location: start,
                    },
                ],
            });
            
            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
        
        test('should tokenize an single atom containing only numbers', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2 );
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(123987)',
                        location: start,
                    },
                ],
            });
            
            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
        
        test('should tokenize an single atom with hyphen and underscore', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'D:/comments/simple.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(atom-start_end)',
                        location: start,
                    },
                ],
            });
            
            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        test('should tokenize a single atom with a single word parameter', () => {
            const start: ILocation = util.location('Z:/parameter.md', 0, 0, 1, 13);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'Z:/parameter.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(the thing)',
                        location: start,

                    }
                ],
            }); 

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        test('should tokenize a single atom with a multi word parameter', () => {
            const start: ILocation = util.location('Z:/parameter.md', 0, 0, 1, 13);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'Z:/parameter.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        text: '(title the thing from beyond\n\tthe swamp)',
                        location: start,

                    }
                ],
            }); 

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        test('should handle nested lisp', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'A:/main.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: `(section-meta
        (external
            (Section ./structure.md)
        )
    )`,
                    }
                ]
            });

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        test('should handle comment with nested lisp', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: { documentPath: 'A:/main.md', documentDepth: 0, documentIndex: 0 },
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: `(section-meta
        (*external
            (Section ./structure.md)
            (*Section ./comments.md)
            (Section ./toc.md)
        )
    )`,
                    }
                ]
            });

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
    });
});