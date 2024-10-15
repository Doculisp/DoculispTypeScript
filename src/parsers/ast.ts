import { AtomAst, IAstContainer, IAstParser, IAstAtom, IAstCommand, IAstEmpty, IAstParameter, IAstValue, RootAst } from "../types/types.ast";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IInternals, StepParseResult } from "../types/types.internal";
import { AtomToken, ParameterToken, TextToken, Token, TokenizedDocument } from "../types/types.tokens";

function buildAstParser(util: IUtil, internals: IInternals): IAstParser {
    function trimArray<T>(length: number, values: T[]): T[] {
        for (let index = 0; index < length; index++) {
            values.shift();
        }

        return values;
    }
    
    function parseTextToken(token: TextToken): IAstValue {
        return {
            type: 'ast-value',
            value: token.text,
            location: token.location,
        };
    }

    function parseParameterToken(parameter: ParameterToken): IAstParameter {
        return {
            type: 'ast-Parameter',
            location: parameter.location,
            value: parameter.text,
        };
    }

    function parseAtomToken(atom: AtomToken): IAstAtom {
        return {
            type: 'ast-atom',
            location: atom.location,
            value: atom.text,
        }
    }

    function parseCommandToken(atom: AtomToken, parameter: ParameterToken): IAstCommand {
        return {
            type: 'ast-Command',
            value: atom.text,
            parameter: parseParameterToken(parameter),
            location: atom.location
        }
    }

    function parseContainerToken(command: AtomToken, ast: AtomAst[]): IAstContainer {
        return {
            type: 'ast-container',
            subStructure: ast,
            location: command.location,
            value: command.text,
        };
    }

    function parseAtom(input: Token[], current: ILocation): StepParseResult<Token[], IAstAtom> {
        if(input.length < 2) {
            return internals.noResultFound();
        }

        const atom = input[0] as Token;
        const close = input[1] as Token;

        if(atom.type !== 'token - atom') {
            return internals.noResultFound();
        }

        if(close.type !== 'token - close parenthesis') {
            return internals.noResultFound();
        }

        return util.ok({
            type: 'parse result',
            subResult: parseAtomToken(atom),
            location: current,
            rest: trimArray(2, input),
        });
    };

    function parseText(input: Token[], current: ILocation): StepParseResult<Token[], IAstValue> {
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

    function parseCommand(input: Token[], current: ILocation): StepParseResult<Token[], IAstCommand> {
        if(input.length < 3) {
            return internals.noResultFound();
        }

        const command = input[0] as Token;
        const parameter = input[1] as Token;
        const closeCommand = input[2] as Token;

        if(command.type !== 'token - atom') {
            return internals.noResultFound();
        }

        if(parameter.type !== 'token - parameter') {
            return internals.noResultFound();
        }

        if(closeCommand.type !== 'token - close parenthesis') {
            return util.fail(`Malformed lisp at ${closeCommand.location}.`, closeCommand.location.documentPath);
        }

        return util.ok({
            type: 'parse result',
            subResult: parseCommandToken(command, parameter),
            location: current,
            rest: trimArray(3, input),
        });
    }

    function parseContainer(input: Token[], current: ILocation): StepParseResult<Token[], IAstContainer> {
        if(input.length < 3) {
            return internals.noResultFound();
        }

        const container = input[0] as Token;
        const atom = input[0] as Token;

        if(container.type !== 'token - atom') {
            return internals.noResultFound();
        }

        if (atom.type !== 'token - atom') {
            return internals.noResultFound();
        }

        const parser = internals.createArrayParser<Token, AtomAst>(parseAtom, parseCommand, parseContainer);
        const parsed = parser.parse(trimArray(1, input), container.location);

        if(!parsed.success) {
            return parsed;
        }

        const [subAst, remaining] = parsed.value;

        const close = remaining.remaining[0] as Token;

        if(remaining.remaining.length === 0 || close.type !== 'token - close parenthesis') {
            return util.fail(`Malformed lisp at ${remaining.location}`, remaining.location.documentPath);
        }

        return util.ok({
            type: 'parse result',
            subResult: parseContainerToken(container, subAst),
            location: current,
            rest: trimArray(1, remaining.remaining),
        });
    }
    
    function parse(tokenMaybe: Result<TokenizedDocument>): Result<RootAst[] | IAstEmpty> {
        if(!tokenMaybe.success) {
            return tokenMaybe;
        }

        const tokenDoc = tokenMaybe.value;
        if(tokenDoc.tokens.length === 0) {
            return util.ok({ type: 'ast-Empty' });
        }

        const parser = internals.createArrayParser<Token, RootAst>(parseText, parseCommand, parseAtom, parseContainer);
        const parsed = parser.parse(tokenDoc.tokens, (tokenDoc.tokens[0] as Token).location);

        if(!parsed.success) {
            return parsed;
        }

        const [result, leftovers] = parsed.value;

        if(0 < leftovers.remaining.length) {
            const token: Token = leftovers.remaining[0] as Token;
            return util.fail(`Unknown Token '${JSON.stringify(token, null, 4)}`, token.location.documentPath)
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