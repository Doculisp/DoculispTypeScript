import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IFail, IProjectLocation, IUtil } from "../../src/types.general";
import { Result } from "../../src/types.general";
import { buildLocation, testable } from "../testHelpers";
import { container } from "../../src/container";

describe('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let toResult: (text: string, location: IProjectLocation) => Result<string> = null as any;
    // let ok: (successfulValue: any) => ISuccess<any> = undefined as any;
    let fail: (message: string, documentPath: string) => IFail = undefined as any;

    function verifyMarkdownResult(textMaybe: Result<string>, options?: Options): void {
        if(textMaybe.success) {
            verifyMarkdown(textMaybe.value, options);
        }
        else {
            verifyAsJson(textMaybe, options);
        }
    }

    beforeAll(() => {
        const verifiers =  getVerifiers(configure);
        verifyAsJson = verifiers.verifyAsJson;
        verifyMarkdown = verifiers.verifyMarkdown;
    });

    beforeEach(() => {
        // ok = null as any;
        fail = null as any;

        toResult = testable.stringWriter.resultBuilder(container, environment => {
            const util: IUtil = environment.buildAs<IUtil>('util');
            // ok = util.ok;
            fail = util.fail;
        });
    });

    describe('basic functionality', () => {
        it('should not write an error', () => {
            const expectedResult = fail('Some failure', 'S:/ome/path.md');
            const writer = testable.stringWriter.writer(container);
            const result = writer.writeAst(expectedResult);

            expect(result).toBe(expectedResult);
        });
    });

    describe('writing markup', () => {
        describe('text block', () => {
            it('should successfully write an empty string', () => {
                const result = toResult('', buildLocation('C:/my_document.md', 4, 8));

                verifyMarkdownResult(result);
            });

            it('should write a simple text of "hello"', () =>{
                const result = toResult('hello', buildLocation('C:/my_document.md', 3, 6));

                verifyMarkdownResult(result);
            });

            it('should write text of "blow fish"', () => {
                const result = toResult('blow fish', buildLocation('C:/my_document.md', 7, 2));

                verifyMarkdownResult(result);
            });

            it('should write a multiline code block', () => {
                const md = `An example of an markdown document with html comments:
\`\`\`markdown
    # A document
    
    <!-- this need
    a summary
    -->
    
    ## Sub section title
\`\`\`
`;
                const result = toResult(md, buildLocation('C:/markdown/multiline.md', 4, 3));
    
                verifyMarkdownResult(result);
            });
        });

        describe('lisp blocks', () => {
            describe('section-meta', () => {
                describe('title', () => {
                    it('should write the title', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
)
`;
                        const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
                
                        verifyMarkdownResult(result);
                    });
                    
                    it('should write the title at different depth', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
)
`;
                        const result = toResult(contents, buildLocation('main.dlisp', 2, 1));
                
                        verifyMarkdownResult(result);
                    });
                    
                    it('should write the title and subtitle', () => {
                        const contents = `
(section-meta
    (title My Cool Document)
    (subtitle A very nice document)
)
`;
                        const result = toResult(contents, buildLocation('main.dlisp', 1, 1));
                
                        verifyMarkdownResult(result);
                    });
                });
            });

            describe('dynamic header', () => {
                it('should write the dynamic header', () => {
                    const doc = `
<!--
(dl
    (section-meta
        (title The use of dynamic headers)
    )
)
-->

Here is how you would use the header.

<!-- (dl (# First Header)) -->

to which I write my word.

<!-- (dl (## Sub-Header)) -->

More words to put to it.

<!-- (dl (# Second Header)) -->

This is the end
`;

                    const result = toResult(doc, buildLocation('./_main.md', 1, 1));

                    verifyMarkdownResult(result);
                });
            });
        });
    });
});