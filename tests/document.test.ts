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

    test('should successfully parse an empty string', () => {
        const result = asSuccess(parse('', 'C:/my_document.md'));

        expect(result.value).toMatchObject([]);
    });

    test('should parse a simple text of "hello"', () => {
        const result = asSuccess(parse('hello', 'C:/my_document.md'));

        expect(result.value).toContainEqual({ location: { line: 0, char: 0, document: 'C:/my_document.md' }, text: 'hello', type: 'text'});
        expect(result.value.length).toBe(1);
    });
});