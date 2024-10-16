import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { Options } from "approvals/lib/Core/Options";
import { ITestableContainer } from "../../../src/types/types.containers";
import { TokenFunction } from '../../../src/types/types.tokens';
import { IFail, ILocation, ISuccess, IUtil, Result } from "../../../src/types/types.general";
import { DocumentMap } from "../../../src/types/types.document";
import { buildLocation, testable } from "../../testHelpers";

describe('tokenizer', () => {
    let tokenizer: TokenFunction = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void = undefined as any;
    let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;
    let util: IUtil = undefined as any;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        tokenizer = testable.token.parserBuilder(container, (environment: ITestableContainer) => {
            util = environment.buildAs<IUtil>('util');
        });

        ok = util.ok;
        fail = util.fail;
    });

    it('should fail if document parsing failed', () => {
        const parseResult = fail('This document did not parse', 'X:/non-exist.dlisp') as Result<DocumentMap>;

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    it('should return empty if given an empty parse result', () => {
        const parseResult: Result<DocumentMap> = ok({
            projectLocation: buildLocation('c:/empty/readme.md', 4, 8),
            parts: [],
        });

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    it('should tokenize text as text', () => {
        const parseResult: Result<DocumentMap> = ok({
            projectLocation: buildLocation('D:/comments/simple.md', 6, 8),
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
        it('should tokenize an empty comment', () => {
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 1, 5 ),
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
        
        it('should tokenize an single atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 2, 7),
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
        
        it('should tokenize an single atom with space after atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 3, 7),
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
        
        it('should tokenize an single atom with new line after atom', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 7, 4),
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
        
        it('should tokenize an single atom containing only numbers', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2 );
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 4, 6),
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
        
        it('should tokenize an single atom with hyphen and underscore', () => {
            const start: ILocation = util.location('D:/comments/simple.md', 0, 0, 4, 2);
            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('D:/comments/simple.md', 7, 7),
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

        it('should tokenize a single atom with a single word parameter', () => {
            const start: ILocation = util.location('Z:/parameter.md', 0, 0, 1, 13);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('Z:/parameter.md', 5, 5),
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

        it('should tokenize a single atom with a multi word parameter', () => {
            const start: ILocation = util.location('Z:/parameter.md', 0, 0, 1, 13);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('Z:/parameter.md', 8, 1),
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

        it('should handle nested lisp', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('A:/main.md', 7, 7),
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: `(section-meta
        (include
            (Section ./structure.md)
        )
    )`,
                    }
                ]
            });

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        it('should handle comment with nested lisp', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('A:/main.md', 7, 1),
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: `(section-meta
        (*include
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

        it('should handle parameter with escaped open paren', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('A:/main.md', 7, 1),
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: "(title The elusive \\())",
                    }
                ]
            });

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });

        it('should handle parameter with escaped close paren', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('A:/main.md', 7, 1),
                parts: [
                    {
                        type: 'lisp',
                        location: start,
                        text: "(title The elusive \\))",
                    }
                ]
            });

            const result = tokenizer(parseResult);

            verifyAsJson(result);
        });
    });
});