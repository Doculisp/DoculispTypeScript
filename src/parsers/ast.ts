import { AstAfter, AstBefore, AstPart, AstSame, IAst, IAstParser, IDocumentOrder } from "../types.ast";
import { IRegisterable } from "../types.containers";
import { Result, ok } from "../types.general";
import { IInternals, StepParseResult } from "../types.internal";
import { Token, TokenizedDocument } from "../types.tokens";

function before() : AstBefore { return -1; }
function after()  : AstAfter  { return  1; }
function same()   : AstSame   { return  0; }

function createDocumentOrder(documentDepth: number, documentIndex: number, line: number, char: number): IDocumentOrder {
    return {
        documentDepth,
        documentIndex,
        line,
        char,
        compare: (other: IDocumentOrder) => {
            if(other.documentDepth < documentDepth) {
                return before();
            }
            if(documentDepth < other.documentDepth) {
                return after();
            }

            if(other.documentIndex < documentIndex) {
                return before();
            }
            if(documentIndex < other.documentIndex) {
                return after();
            }

            if(other.line < line) {
                return before();
            }
            if(line < other.line) {
                return after();
            }

            if(other.char < char) {
                return before();
            }
            if(char < other.char) {
                return after();
            }

            return same();
        },
    };
}

function isText(input: Token[], line: number, char: number): StepParseResult<Token[], AstPart> {
    const token: Token = input.shift() as Token;
    if(token.type === 'token - text') {
        let order = createDocumentOrder(0, 0, token.location.line, token.location.char);
        return ok({
            type: 'parse result',
            subResult: {
                type: 'ast-write',
                documentOrder: order,
                value: token.text,
            },
            line: line,
            char: char + 1,
            rest: input
        });
    }
    return ok(false);
}

function buildAstParser(internals: IInternals): IAstParser {
    return {
        parse(maybeTokens: Result<TokenizedDocument>): Result<IAst> {
            if(maybeTokens.success){
                const document = maybeTokens.value;
                const parser = internals.createArrayParser(isText);
                const parsed = parser.parse(document.tokens, 0, 0);
                
                if(parsed.success) {
                    const [result, _leftovers] = parsed.value;

                    if(0 < result.length){
                        return ok({
                            documentPath: document.documentPath,
                            section: {
                                type: 'ast-section',
                                ast: result,
                                documentOrder: createDocumentOrder(0, 0, 0, 0),
                            },
                        });
                    }

                    return ok({
                        documentPath: document.documentPath,
                        section: { type: 'ast-empty' },
                    });
                }

                return parsed;
            }

            return maybeTokens;
        }
    };
}

const astParser: IRegisterable = {
    builder: (internals: IInternals) => buildAstParser(internals),
    name: 'astParse',
    singleton: true,
    dependencies: ['parser']
};

export {
    astParser,
};