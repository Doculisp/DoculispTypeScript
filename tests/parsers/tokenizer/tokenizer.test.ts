
import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";
import { ITestableContainer } from "../../../src/types.containers";
import { verifyAsJson } from "approvals/lib/Providers/Jest/JestApprovals";
import { TokenFunction } from '../../../src/types.tokens';
import { Result, fail } from "../../../src/types.general";
import { DocumentMap } from "../../../src/types.document";

describe('tokenizer', () => {
    let environment: ITestableContainer = undefined as any;
    let tokenizer: TokenFunction = undefined as any;

    beforeAll(() => {
        configure({
            reporters: [new JestReporter(), 'vscode'],
        });
    });

    beforeEach(() => {
        environment = container.buildTestable();
        tokenizer = environment.buildAs<TokenFunction>('tokenizer');
    });

    test('should fail if document parsing failed', () => {
        const parseResult = fail('This document did not parse', 'X:/non-exist.dlisp') as Result<DocumentMap>;

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    test('should return empty if given an empty parse result', () => {
        const parseResult: Result<DocumentMap> = {
            success: true,
            value: {
                documentPath: 'c:/empty/readme.md',
                parts: [],
            },
        };

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });

    test('should tokenize text as text', () => {
        const parseResult: Result<DocumentMap> = {
            success: true,
            value: {
                documentPath: 'myText.md',
                parts: [
                    {
                        type: 'text',
                        text: 'hello my text',
                        location: {
                            line: 5,
                            char: 23
                        },
                    }
                ],
            },
        };

        const result = tokenizer(parseResult);

        verifyAsJson(result);
    });
});