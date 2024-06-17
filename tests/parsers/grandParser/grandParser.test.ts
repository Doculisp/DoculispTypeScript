import { container } from "../../../src/container";
import { configure } from "approvals/lib/config";
import { verify } from "approvals/lib/Providers/Jest/JestApprovals";
import { ITestableContainer } from "../../../src/types.containers";
import { IUtil } from '../../../src/types.general';
import { IProjectLocation } from "../../../src/types.general";
import { Result } from "../../../src/types.general";
import { DocumentMap } from '../../../src/types.document';
import { TokenizedDocument } from '../../../src/types.tokens';
import { order } from "../../tools";
import { IAst } from '../../../src/types.ast';
import { IGrandParser } from '../../../src/types.grandParser';
import { JestReporter } from "approvals/lib/Providers/Jest/JestReporter";

describe('grandPareser', () => {
    let environment: ITestableContainer = undefined as any;
    let util: IUtil = undefined as any

    beforeEach(() => {
        configure({
            reporters: [new JestReporter()],
        });
        environment = container.buildTestable();
        util = environment.buildAs<IUtil>('util');
    });

    it('should pass the success from each parse to the next', () => {
        const documentPath = './enchilada.md';
        let result = '';

        function document(text: string, projectLocation: IProjectLocation):  Result<DocumentMap> {
            result += `\n\n---- DOCUMENT ----\n\n${JSON.stringify(order(projectLocation))}\n\n${text}`;

            return util.ok({
                parts: [
                    {
                        type: 'text',
                        location: util.toLocation(projectLocation, 1, 1),
                        text: 'Hello Document!',
                    }
                ],
                projectLocation,
            });
        }

        function tockenize(documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
            result += `\n\n---- TOKENIZER ----\n\n ${JSON.stringify(order(documentMap))}`;

            if(!documentMap.success) {
                return documentMap;
            }

            return util.ok({
                projectLocation: documentMap.value.projectLocation,
                tokens: [
                    {
                        type: 'token - text',
                        text: 'Hello Tokenizer!',
                        location: util.toLocation(documentMap.value.projectLocation, 1, 1),
                    }
                ],
            });
        }

        function astize(tokenResults: Result<TokenizedDocument>): Result<IAst> {
            result += `\n\n---- AST ---\n\n${JSON.stringify(order(tokenResults))}`;

            if(!tokenResults.success) {
                return tokenResults;
            }

            return util.ok({
                section: {
                    type: 'ast-section',
                    ast: [
                        {
                            type: 'ast-write',
                            value: 'Hello AST!',
                            documentOrder: util.toLocation(tokenResults.value.projectLocation, 1, 1),
                        },
                    ],
                    documentOrder: util.toLocation(tokenResults.value.projectLocation, 1, 1),
                    external: [],
                },
                projectLocation: util.toLocation(tokenResults.value.projectLocation, 1, 1)
            });
        }

        environment.replaceValue(document, 'documentParse');
        environment.replaceValue(tockenize, 'tokenizer');
        environment.replaceValue({ parse: astize }, 'astParse');

        const grand = environment.buildAs<IGrandParser>('grandParser');

        const parsed = grand.parse(documentPath, 'Hello World!', 1, 1);

        result += `\n\n--- Grand Result ----\n\n${JSON.stringify(order(parsed))}`;

        verify(result.trim());
    });
});