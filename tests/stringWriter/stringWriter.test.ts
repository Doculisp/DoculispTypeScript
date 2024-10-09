import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifiers } from "../tools";
import { IFail, IProjectLocation, IUtil } from "../../src/types.general";
import { Result } from "../../src/types.general";
import { buildLocation, testable } from "../testHelpers";
import { IDirectoryHandler, IFileLoader } from "../../src/types.fileHandler";
import { container } from "../../src/container";
import { IDictionary } from "../../src/types.containers";
import fs from 'fs';
import path from "path";

describe.skip('stringWriter', () => {
    let verifyAsJson: (data: any, options?: Options) => void;
    let verifyMarkdown: (sut: any, options?: Options) => void;
    let toResult: (text: string, location: IProjectLocation) => Result<string> = null as any;
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

            describe('sub documents', () => {
                let ok: (value: any) => Result<any> = undefined as any;
                let addFile : (filePath: string, body: string) => void = undefined as any;

                beforeEach(() => {
                    let files: IDictionary<Result<string>> = undefined as any;
                    files = {};

                    addFile = (filePath: string, body: string): void => {
                        files[path.basename(filePath)] = ok(body);
                    };

                    toResult = testable.stringWriter.resultBuilder(container, environment => {
                        const util: IUtil = environment.buildAs<IUtil>('util');
                        ok = util.ok;
                        const fileHandler: IFileLoader & IDirectoryHandler = {
                            load: function(path: string): Result<string> {
                                const r = files[path];
                                if(r) {
                                    return r;
                                }

                                return fail('path not yet setup', path);
                            },
                            getProcessWorkingDirectory() {
                                return './';
                            },
                            setProcessWorkingDirectory() {}
                        };

                        environment.replaceBuilder(() => fileHandler, [], 'fileHandler', true);
                    });
                });

                it('should write the contents of a sub document', () => {
                    const subPath = './sub.md'
                    const subDocument = `
<!--
(dl
    (section-meta
        (title My Sub Section)
    )
)
-->

This sub section rocks!
`;

                    addFile(subPath, subDocument);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub section)
        (include
            (Section ${subPath})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content)) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the unlabeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc unlabeled))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the numbered table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc numbered))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the numbered-labeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc numbered-labeled))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the bulleted table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc bulleted))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });

                it('should write the bulleted-labeled table of contents', () => {
                    const subPath1 = './sub.md'
                    const subDocument1 = `
<!--
(dl
    (section-meta
        (title My First Sub Section)
    )
)
-->

This sub section rocks!
`;

                    const subPath2 = './second.md';
                    const subDocument2 = `
<!--
(dl
    (section-meta
        (title My second Sub Section)
    )
)
-->
`;

                    addFile(subPath1, subDocument1);
                    addFile(subPath2, subDocument2);

                    const path = './_main.md';
                    const doc = `
<!--
(dl
    (section-meta
        (title Me and my sub sections)
        (include
            (Section ${subPath1})
            (Block ${subPath2})
        )
    )
)
-->

a truly divided tail.

<!-- (dl (content (toc bulleted-labeled))) -->
`;

                    const result = toResult(doc, buildLocation(path, 1, 1));
                    verifyMarkdownResult(result);
                });
            });

        });

        describe('own documentation', () => {
            let workingDir: string = null as any;
            beforeEach(() => {
                workingDir = process.cwd();
                process.chdir('./documentation');
                toResult = testable.stringWriter.resultBuilder(container);
            });

            afterEach(() => {
                process.chdir(workingDir);
            });

            it('should write the structure part of its own documentation', () => {
                const filePath = './structure.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the doculisp part of its own documentation', () => {
                const filePath = './doculisp.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the section-meta part of its own documentation', () => {
                const filePath = './section-meta.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the content part of its own documentation', () => {
                const filePath = './content.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the headings part of its own documentation', () => {
                const filePath = './headings.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the comment part of its own documentation', () => {
                const filePath = './comment.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the keywords part of its own documentation', () => {
                const filePath = './keywords.md';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });

            it('should write the whole of its own documentation', () => {
                const filePath = './_main.dlisp';
                const doc: string = fs.readFileSync(filePath, { encoding: 'utf8' });

                const result = toResult(doc, buildLocation(filePath, 1, 1));
                verifyMarkdownResult(result);
            });
        });
    });
});