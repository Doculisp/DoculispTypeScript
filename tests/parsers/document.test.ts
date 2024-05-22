import { container } from "../../src/container";
import { ITestableContainer } from "../../src/types.containers";
import { DocumentParser } from "../../src/types.document";
import { verifyAsJson } from "approvals/lib/Providers/Jest/JestApprovals";
import { configure } from "approvals/lib/config";
import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";

describe('document', () => {
    let environment: ITestableContainer = undefined as any;
    let parse: DocumentParser = undefined as any;

    beforeAll(() => {
        configure({
            reporters: [new JestReporter(), 'vscode'],
        });
    });

    beforeEach(() => {
        environment = container.buildTestable();
        parse = environment.buildAs<DocumentParser>('documentParse');
    });

    describe('parsing markup', () => {
        describe('text', () => {
            test('should successfully parse an empty string', () => {
                const result = parse('', 'C:/my_document.md')
        
                verifyAsJson(result);
            });
        
            test('should parse a simple text of "hello"', () => {
                const result = parse('hello', 'C:/my_document.md')
        
                verifyAsJson(result);
            });
    
            test('should parse text of "blow fish"', () => {
                const result = parse('blow fish', 'C:/my_document.md')
                verifyAsJson(result);
            });
    
            test('should parse text of " blow fish"', () => {
                const result = parse(' blow fish', 'C:/my_document.md')
                verifyAsJson(result);
            });
    
            test('should parse text of " blow fish "', () => {
                const result = parse(' blow fish ', 'C:/my_document.md')
                verifyAsJson(result);
            });
    
            test('should parse text of "   \\r\\n blow fish"', () => {
                const result = parse('   \r\n blow fish', 'C:/my_document.md');
                verifyAsJson(result);
            });
        });

        describe('html comments', () => {
            test('should not parse html comments', () => {
                const md = `<!-- This is a comment -->hello bro`.trim();
    
                const result = parse(md, 'C:/readme.md')
    
                verifyAsJson(result);
            });
    
            test('should not parse html but preserve new line counts comments', () => {
                const md = `<!--
    This is a comment
    -->
                     \t\thello bro
                     `;
    
                const result = parse(md, 'C:/readme.md')
    
                verifyAsJson(result);
            });
    
            test('should not parse html comments in the middle of text.', () => {
                const md = `hello
    <!-- need stuff here -->
    
    world`;
    
                const result = parse(md, 'C:/comments/helloWorld.md');
    
                verifyAsJson(result);
            });
    
            test('should parse html comments inside an inline code block', () => {
                const md = '`<!-- an example html comment -->`';
    
                const result = parse(md, 'C:/html/inline.md');
    
                verifyAsJson(result);
            });
    
            test('should parse html comments inside a multiline code block', () => {
                const md = `An example of an markdown document with html comments:
    \`\`\`markdown
    # A document
    
    <!-- this need
    a summary
    -->
    
    ## Sub section title
    \`\`\`
    `;
                const result = parse(md, 'C:/markdown/multiline.md');
    
                verifyAsJson(result);
            });
    
            test('should fail to parse if html comment is not closed', () => {
                let md = `<!--
    Hello
    World
    Boom
    `;
                const result = parse(md, 'C:/examples/bad.md');
    
                verifyAsJson(result);
            });
    
            test('should fail if inline code block does not close', () => {
                let md = '`let b = 7';
    
                const result = parse(md, 'C:/bad/noCloseInline.md');
    
                verifyAsJson(result);
            });
    
            test('should fail to parse an inline code block with a line break', () => {
                let md = `\`let a = 0;
    let b = a;
    \``;
    
                const result = parse(md, 'C:/examples/badInline.md');
    
                verifyAsJson(result);
            });
    
            test('should fail to parse a multiline code block that does not close', () => {
                let md = '```\nlet a = "hello;\nlet b = "world"\nconsole.log(a + " " + b);\n';
    
                const result = parse(md, 'C:/bad/examples/multiline.md');
    
                verifyAsJson(result);
            });
        });
    
        describe('Doculisp', () => {
            test('should parse a doculisp block at top of file', () => {
                const md = '<!-- (dl (# header)) -->';
    
                const result = parse(md, '_main.md');
    
                verifyAsJson(result);
            });
            
            test('should parse a doculisp block in the middle of file', () => {
            const md = '# Title\r\nsome text about title\r\n<!--\r\nSome lisp: (dl (# two)) -->\r\nMickey Mouse Hotline.';
    
                const result = parse(md, '_main.md');
    
                verifyAsJson(result);
            });
        });
    });

    describe('parsing .dlisp files', () => {
        test('should handle a correctly formatted file', () => {
            let dlisp = `
(section-meta
    (title Doculisp)
    (external
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

            let result = parse(dlisp, 'C:/main.dlisp');

            verifyAsJson(result);
        });
    });
});