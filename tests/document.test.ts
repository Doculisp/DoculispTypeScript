import { container } from "../src/container";
import { ITestableContainer } from "../src/types.containers";
import { DocumentParser } from "../src/types.document";
import { asSuccess } from "../src/types.general";
import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";
import { verify } from "approvals/lib/Providers/Jest/JestApprovals";
// import { ConfigModifier, Options } from "approvals/lib/Core/Options";

describe('document', () => {
    // let options: Options = undefined as any;
    let environment: ITestableContainer = undefined as any;
    let parse: DocumentParser = undefined as any;

    // beforeAll(() => {
    //     const modifier: ConfigModifier = (c) => {
    //         c.reporters = [new JestReporter(), "BeyondCompare"];
    //         return c;
    //     };

    //     options = new Options();
    //     options = options.withConfig(modifier);
    // });

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
        // verifyAsJson(result, options);
    });
});