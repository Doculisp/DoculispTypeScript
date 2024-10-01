import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { getVerifier } from "../../tools";
import { Options } from "approvals/lib/Core/Options";
import { ITestableContainer } from "../../../src/types.containers";
import { TokenFunction, TokenizedDocument } from '../../../src/types.tokens';
import { IFail, ILocation, IProjectLocation, ISuccess, IUtil, Result } from "../../../src/types.general";
import { DocumentMap, DocumentParser } from "../../../src/types.document";
import fs from 'fs';
import { buildLocation } from "../../testHelpers";

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

        it('should handle comment with nested lisp', () => {
            const start: ILocation = util.location('A:/main.md', 0, 0, 2, 1);

            let parseResult: Result<DocumentMap> = ok({
                projectLocation: buildLocation('A:/main.md', 7, 1),
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

    describe('parsing a real documents', () => {
        let toResult: (text: string, location: IProjectLocation) => Result<TokenizedDocument> = undefined as any;

        beforeEach(() => {
            const docParse: DocumentParser = environment.buildAs<DocumentParser>('documentParse');

            toResult = (text: string, location: IProjectLocation): Result<TokenizedDocument> => {
                const doc = docParse(text, location);
                return tokenizer(doc);
            }
        });

        function getFileContent(fileName: string, depth: number, index: number): Result<TokenizedDocument> {
            const path = `./documentation/${fileName}`;
            const content = fs.readFileSync(path, { encoding: 'utf8' });
            
            const location: IProjectLocation = buildLocation(path, depth, index)

            return toResult(content, location);
        }
        it('should parse structure.md', () => {
            const result = getFileContent('structure.md', 2, 1);
            verifyAsJson(result);
        });
        
        it('should parse doculisp.md', () => {
            const result = getFileContent('doculisp.md', 2, 2);
            verifyAsJson(result);
        });
        
        it('should parse section-meta.md', () => {
            const result = getFileContent('section-meta.md', 2, 3);
            verifyAsJson(result);
        });
        
        it('should parse content.md', () => {
            const result = getFileContent('content.md', 2, 4);
            verifyAsJson(result);
        });
        
        it('should parse headings.md', () => {
            const result = getFileContent('headings.md', 2, 5);
            verifyAsJson(result);
        });
        
        it('should parse comment.md', () => {
            const result = getFileContent('comment.md', 2, 6);
            verifyAsJson(result);
        });
        
        it('should parse keywords.md', () => {
            const result = getFileContent('keywords.md', 2, 7);
            verifyAsJson(result);
        });
        
        it('should parse _main.dlisp', () => {
            const result = getFileContent('_main.dlisp', 1, 1);
            verifyAsJson(result);
        });
    });
});