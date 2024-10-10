import fs from 'fs';
import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { Options } from "approvals/lib/Core/Options";
import { getVerifier } from "../../tools";
import { DocumentMap, DocumentParser } from "../../../src/types/types.document";
import { IProjectLocation, Result } from "../../../src/types/types.general";
import { buildLocation, testable } from "../../testHelpers";

describe('document', () => {
    let parse: DocumentParser = undefined as any;
    let verifyAsJson: (data: any, options?: Options) => void;

    beforeAll(() => {
        verifyAsJson = getVerifier(configure);
    });

    beforeEach(() => {
        parse = testable.document.resultBuilder(container);
    });

    it('should not allow a document with a zero depth.', () => {
        const result = parse('hello', buildLocation('C:/my_document.md', 0, 6));
        
        verifyAsJson(result);
    });

    it('should not allow a document with a negative depth.', () => {
        const result = parse('hello', buildLocation('C:/my_document.md', -1, 6));
        
        verifyAsJson(result);
    });

    it('should not allow a document with a zero index.', () => {
        const result = parse('', buildLocation('C:/my_document.md', 4, 0));
        
        verifyAsJson(result);
    });

    it('should not allow a document with a negative index.', () => {
        const result = parse('', buildLocation('C:/my_document.md', 4, -1));
        
        verifyAsJson(result);
    });

    describe('parsing markup', () => {
        describe('text', () => {
            it('should successfully parse an empty string', () => {
                const result = parse('', buildLocation('C:/my_document.md', 4, 8));
        
                verifyAsJson(result);
            });
        
            it('should parse a simple text of "hello"', () => {
                const result = parse('hello', buildLocation('C:/my_document.md', 3, 6));
        
                verifyAsJson(result);
            });
    
            it('should parse text of "blow fish"', () => {
                const result = parse('blow fish', buildLocation('C:/my_document.md', 7, 2));
                verifyAsJson(result);
            });
    
            it('should parse text of " blow fish"', () => {
                const result = parse(' blow fish', buildLocation('C:/my_document.md', 4, 6));
                verifyAsJson(result);
            });
    
            it('should parse text of " blow fish "', () => {
                const result = parse(' blow fish ', buildLocation('C:/my_document.md', 7, 1));
                verifyAsJson(result);
            });
    
            it('should parse text of "   \\r\\n blow fish"', () => {
                const result = parse('   \r\n blow fish', buildLocation('C:/my_document.md', 1, 8));
                verifyAsJson(result);
            });
        });

        describe('html comments', () => {
            it('should not parse html comments', () => {
                const md = `<!-- This is a comment -->hello bro`.trim();
    
                const result = parse(md, buildLocation('C:/readme.md', 5, 2));
    
                verifyAsJson(result);
            });
    
            it('should not parse html but preserve new line counts comments', () => {
                const md = `<!--
    This is a comment
    -->
                     \t\thello bro
                     `;
    
                const result = parse(md, buildLocation('C:/readme.md', 8, 3));
    
                verifyAsJson(result);
            });
    
            it('should not parse html comments in the middle of text.', () => {
                const md = `hello
    <!-- need stuff here -->
    
    world`;
    
                const result = parse(md, buildLocation('C:/comments/helloWorld.md', 1, 2));
    
                verifyAsJson(result);
            });
    
            it('should parse html comments inside an inline code block', () => {
                const md = '`<!-- an example html comment -->`';
    
                const result = parse(md, buildLocation('C:/html/inline.md', 5, 3));
    
                verifyAsJson(result);
            });
    
            it('should parse html comments inside a multiline code block', () => {
                const md = `An example of an markdown document with html comments:
    \`\`\`markdown
    # A document
    
    <!-- this need
    a summary
    -->
    
    ## Sub section title
    \`\`\`
    `;
                const result = parse(md, buildLocation('C:/markdown/multiline.md', 4, 3));
    
                verifyAsJson(result);
            });
    
            it('should fail to parse if html comment is not closed', () => {
                let md = `<!--
    Hello
    World
    Boom
    `;
                const result = parse(md, buildLocation('C:/examples/bad.md', 5, 4));
    
                verifyAsJson(result);
            });
    
            it('should fail if inline code block does not close', () => {
                let md = '`let b = 7';
    
                const result = parse(md, buildLocation('C:/bad/noCloseInline.md', 8, 4));
    
                verifyAsJson(result);
            });
    
            it('should fail to parse an inline code block with a line break', () => {
                let md = `\`let a = 0;
    let b = a;
    \``;
    
                const result = parse(md, buildLocation('C:/examples/badInline.md', 6, 8));
    
                verifyAsJson(result);
            });
    
            it('should fail to parse a multiline code block that does not close', () => {
                let md = '```\nlet a = "hello;\nlet b = "world"\nconsole.log(a + " " + b);\n';
    
                const result = parse(md, buildLocation('C:/bad/examples/multiline.md', 2, 7));
    
                verifyAsJson(result);
            });
        });
    
        describe('Doculisp', () => {
            it('should parse a doculisp block at top of file', () => {
                const md = '<!-- (dl (# header)) -->';
    
                const result = parse(md, buildLocation('_main.md', 3, 7));
    
                verifyAsJson(result);
            });
            
            it('should parse a doculisp block in the middle of file', () => {
            const md = '# Title\r\nsome text about title\r\n<!--\r\nSome lisp: (dl (# two)) -->\r\nMickey Mouse Hotline.';
    
                const result = parse(md, buildLocation('_main.md', 7, 5));
    
                verifyAsJson(result);
            });

            it('should parse lisp outside an html tag as text', () => {
                const md = '(# Heading) Hello Doculisp';

                const result = parse(md, buildLocation('documentExample.md', 3, 4));

                verifyAsJson(result);
            });

            it('should parse Doculisplisp outside an html tag as text', () => {
                const md = '(dl (# Heading)) Hello Doculisp';

                const result = parse(md, buildLocation('documentExample2.md', 8, 8));

                verifyAsJson(result);
            });
        });
    });

    describe('parsing .dlisp files', () => {
        it('should handle a correctly formatted file', () => {
            let dlisp = `
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

(content (toc numbered-labeled))
`;

            let result = parse(dlisp, buildLocation('C:/main.dlisp', 7, 1));

            verifyAsJson(result);
        });

        it('should fail to parse a file that contains a dl atom', () => {
            let dlisp = `(dl
(section-meta
    (title Doculisp)
)

(content (toc numbered-labeled)))
`;

            let result = parse(dlisp, buildLocation('C:/bad/extraDl.dlisp', 5, 6));

            verifyAsJson(result);
        });

        it('should handle a file with parentheses that do not close', () => {
            let dlisp = `
(section-meta
    (title Doculisp)
    (include
        (Section ./structure.md)
        (Section ./doculisp.md
        (Section ./section-meta.md)
    )
)
`;

            let result = parse(dlisp, buildLocation('C:/main.dlisp', 6, 1));

            verifyAsJson(result);
        });

        it('should handle a file with to many parenthesis', () => {
            let dlisp = `(content (toc numbered-labeled)) )`;

            let result = parse(dlisp, buildLocation('C:/main.dlisp', 5, 8));

            verifyAsJson(result);
        });
    });

    describe('parsing real files', () => {
        it('should parse the content of structure.md first inline error', () =>{
            const result = parse(`<!--
(dl
    (section-meta
        (title Basic Structure)
    )
)
-->

The basic structure of Doculisp is all code is contained within blocks. A block is constructed within an HTML comment region. It starts with an open parentheses \`(\`
`, buildLocation('./structure.md', 2, 1));
        
        verifyAsJson(result);
        });

        it('should parse the content of structure.md second inline error', () =>{
            const result = parse(`<!--
(dl
    (section-meta
        (title Basic Structure)
    )
)
-->

The basic structure of Doculisp is all code is contained within blocks. A block is constructed within an HTML comment region. It starts with an open parentheses \`(\` followed by a sting of non-whitespace characters. This is called an atom. It then has 1 of three possibilities. It can have a parameter, a new block, or nothing. All blocks must close with a close parentheses \`)\`.

Even the Doculisp main block follows this.

Example

\`\`\`markdown
<!--
(dl
    (section-meta
        (title Basic Structure)
    )
)
-->
\`\`\`

The first block is the \`dl\` block. In it \`dl\` is the atom. It contains the \`section-meta\` sub-block.  That block has the atom \`section-meta\` followed by a further sub block. The last sub block is the \`title\` sub block. In it \`title\` is the atom and \`Basic Structure\`
`, buildLocation('./structure.md', 2, 1));
        
        verifyAsJson(result);
        });

        function getContent(fileName: string, depth: number, index: number): Result<DocumentMap> {
            const path: string = `./documentation/${fileName}`;
            const location: IProjectLocation = buildLocation(path, depth, index);

            const content = parse(fs.readFileSync(path, { encoding: 'utf8' }), location);
            return content;
        }

        it('should parse the content of structure.md from the file system', () => {
            const result = getContent('structure.md', 2, 1);
            verifyAsJson(result);
        });

        it('should parse the content of doculisp.md from the file system', () => {
            const result = getContent('doculisp.md', 2, 2);
            verifyAsJson(result);
        });

        it('should parse the content of section-meta.md from the file system', () => {
            const result = getContent('section-meta.md', 2, 3);
            verifyAsJson(result);
        });

        it('should parse the content of content.md from the file system', () => {
            const result = getContent('content.md', 2, 4);
            verifyAsJson(result);
        });

        it('should parse the content of headings.md from the file system', () => {
            const result = getContent('headings.md', 2, 5);
            verifyAsJson(result);
        });

        it('should parse the content of comment.md from the file system', () => {
            const result = getContent('comment.md', 2, 6);
            verifyAsJson(result);
        });

        it('should parse the content of keywords.md from the file system', () => {
            const result = getContent('keywords.md', 2, 7);
            verifyAsJson(result);
        });

        it('should parse the content of contributors.md from the file system', () => {
            const result = getContent('contributors.md', 3, 8);
            verifyAsJson(result);
        });

        it('should parse the content of _main.dlisp from the file system', () => {
            const result = getContent('_main.dlisp', 1, 1);
            verifyAsJson(result);
        });
    });
});