import { container } from "../src/container";
import { ITestableContainer } from "../src/types.containers";
import { DocumentParser } from "../src/types.document";
import { verifyAsJson } from "approvals/lib/Providers/Jest/JestApprovals";
import { configure } from "approvals/lib/config";
import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";

describe('document', () => {
    let environment: ITestableContainer = undefined as any;
    let parse: DocumentParser = undefined as any;

    beforeAll(() => {
        configure({
            reporters: [new JestReporter(), "BeyondCompare"],
        });
    });

    beforeEach(() => {
        environment = container.buildTestable();
        parse = environment.buildAs<DocumentParser>('documentParse');
    });

    describe('parsing markup', () => {
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

    describe('parsing html comments', () => {
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
    });
});