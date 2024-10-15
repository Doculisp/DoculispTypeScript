import { IAstParser, IEmpty, IValue, RootAst } from "../types/types.ast";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IInternals, StepParseResult } from "../types/types.internal";
import { TextToken, Token, TokenizedDocument } from "../types/types.tokens";

function buildAstParser(util: IUtil, internals: IInternals): IAstParser {
    function trimArray<T>(length: number, values: T[]): T[] {
        for (let index = 0; index < length; index++) {
            values.shift();
        }

        return values;
    }
    
    function parseTextToken(token: TextToken): IValue {
        return {
            type: 'ast-value',
            value: token.text,
            location: token.location,
        };
    }

    function parseText(input: Token[], current: ILocation): StepParseResult<Token[], RootAst> {
        if(input.length < 1) {
            return internals.noResultFound();
        }

        const textToken = input[0] as Token;

        if(textToken.type !== 'token - text') {
            return internals.noResultFound();
        }

        return util.ok({
            type: 'parse result',
            subResult: parseTextToken(textToken),
            location: current,
            rest: trimArray(1, input),
        });
    };
    
    function parse(tokenMaybe: Result<TokenizedDocument>): Result<RootAst[] | IEmpty> {
        if(!tokenMaybe.success) {
            return tokenMaybe;
        }

        const tokenDoc = tokenMaybe.value;
        if(tokenDoc.tokens.length === 0) {
            return util.ok({ type: 'ast-Empty' });
        }

        const parser = internals.createArrayParser(parseText);
        const parsed = parser.parse(tokenDoc.tokens, (tokenDoc.tokens[0] as Token).location);

        if(!parsed.success) {
            return parsed;
        }

        const [result, leftovers] = parsed.value;

        if(leftovers.remaining.length < 0) {
            const token: Token = leftovers.remaining[0] as Token;
            return util.fail(`Unknown Token '${token}`, token.location.documentPath)
        }
        
        return util.ok(result);
    }

    return {
        parse,
    };
}

const astParser: IRegisterable = {
    builder: (util: IUtil, internals: IInternals) => buildAstParser(util, internals),
    name: 'astParser',
    singleton: false,
    dependencies: ['util', 'internals']
};

export {
    astParser,
};