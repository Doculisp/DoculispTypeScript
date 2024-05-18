import { container } from "../src/container";
import { ITestableContainer } from "../src/types.containers";
import { DocumentParser } from "../src/types.document";
import { asSuccess } from "../src/types.general";

describe('document', () => {
    let environment: ITestableContainer = undefined as any;
    let parse: DocumentParser = undefined as any;

    beforeEach(() => {
        environment = container.buildTestable();
        parse = environment.buildAs<DocumentParser>('documentParse');
    });

    describe('parsing markup', () => {
        test('should successfully parse an empty string', () => {
            const result = asSuccess(parse('', 'C:/my_document.md'));
    
            expect(result.value).toMatchObject([]);
        });
    
        test('should parse a simple text of "hello"', () => {
            const result = asSuccess(parse('hello', 'C:/my_document.md'));
    
            expect(result.value).toContainEqual({ location: { line: 1, char: 1, document: 'C:/my_document.md' }, text: 'hello', type: 'text'});
            expect(result.value.length).toBe(1);
        });

        test('should parse text of "blow fish"', () => {
            const result = asSuccess(parse('blow fish', 'C:/my_document.md'));
    
            expect(result.value).toContainEqual({ location: { line: 1, char: 1, document: 'C:/my_document.md' }, text: 'blow fish', type: 'text'});
            expect(result.value.length).toBe(1);
        });

//         test('should not parse html comments', () => {
//             const md = `
// <!-- This is a comment -->
// hello bro
// `.trim();

//             const result = asSuccess(parse(md, 'C:/readme.md'));

//             expect(result.value).toContain({ location: { line: } });
//         });

        // describe('containing doculisp', () => {

        // });
    });
});