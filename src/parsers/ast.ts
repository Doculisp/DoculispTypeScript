import { AtomAst, IAstContainer, IAstParser, IAstAtom, IAstCommand, IAstEmpty, IAstParameter, IAstValue, RootAst, CoreAst } from "../types/types.ast";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, ResultCode } from "../types/types.general";
import { IInternals, StepParseResult } from "../types/types.internal";
import { AtomToken, ParameterToken, TextToken, Token, TokenizedDocument } from "../types/types.tokens";
import { ITrimArray } from "../types/types.trimArray";

function buildAstParser(util: IUtil, internals: IInternals, trimArray: ITrimArray): IAstParser {
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
            type: 'ast-command',
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
            rest: trimArray.trim(2, input),
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
            rest: trimArray.trim(1, input),
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
            const valueLines = closeCommand.text.split(/\r\n|\r|\n/);
            let endLine = valueLines.length + closeCommand.location.line - 1;
            let endChar = valueLines.length === 1 ?
                closeCommand.location.char + closeCommand.text.length - 1 :
                valueLines.at(-1) ? valueLines.at(-1)!.length : closeCommand.location.char;
            return util.codeFailure(`Malformed lisp at ${closeCommand.location}.`, { documentPath: closeCommand.location.documentPath, start: { line: closeCommand.location.line, char: closeCommand.location.char }, end: { line: endLine, char: endChar } });
        }

        return util.ok({
            type: 'parse result',
            subResult: parseCommandToken(command, parameter),
            location: current,
            rest: trimArray.trim(3, input),
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
        
        const parsed = parser.parse(trimArray.trim(1, input), container.location);

        if(!parsed.success) {
            return parsed;
        }

        const [subAst, remaining] = parsed.value;

        if(remaining.remaining.length === 0) {
            // No more tokens - find the last token in input to calculate proper end location
            const lastToken = input[input.length - 1] as Token;
            const lastTokenText = 'text' in lastToken ? lastToken.text : ')';
            const endLine = lastToken.location.line;
            const endChar = lastToken.location.char + lastTokenText.length - 1;
            
            return util.codeFailure(`Missing close parenthesis in block at '${container.location.documentPath}' Line: ${container.location.line}, Char: ${container.location.char}`, { documentPath: remaining.location.documentPath, start: { line: container.location.line, char: container.location.char }, end: { line: endLine, char: endChar } });
        }

        const close = remaining.remaining[0] as Token;

        if(close.type !== 'token - close parenthesis') {
            // Found a token, but it's not a close parenthesis - report error for the actual token
            const tokenText = 'text' in close ? close.text : ')'; // CloseParenthesisToken doesn't have text property
            const endChar = close.location.char + tokenText.length - 1;
            return util.codeFailure(`Malformed lisp at ${close.location} - expected close parenthesis but found '${tokenText}'`, { documentPath: close.location.documentPath, start: { line: close.location.line, char: close.location.char }, end: { line: close.location.line, char: endChar } });
        }

        return util.ok({
            type: 'parse result',
            subResult: parseContainerToken(container, subAst),
            location: current,
            rest: trimArray.trim(1, remaining.remaining),
        });
    }
    
    function parse(tokenMaybe: ResultCode<TokenizedDocument>): ResultCode<RootAst | IAstEmpty> {
        if(!tokenMaybe.success) {
            return tokenMaybe;
        }

        const tokenDoc = tokenMaybe.value;
        if(tokenDoc.tokens.length === 0) {
            return util.ok({
                type: 'ast-Empty',
                location: tokenMaybe.value.projectLocation
            });
        }

        const parser = internals.createArrayParser<Token, CoreAst>(parseText, parseCommand, parseAtom, parseContainer);
        const parsed = parser.parse(tokenDoc.tokens, (tokenDoc.tokens[0] as Token).location);

        if(!parsed.success) {
            return parsed;
        }

        const [result, leftovers] = parsed.value;

        if(0 < leftovers.remaining.length) {
            const token: Token = leftovers.remaining[0] as Token;
            const tokenText = 'text' in token ? token.text : ')'; // CloseParenthesisToken doesn't have text property
            const endChar = token.location.char + tokenText.length - 1; // -1 because positions are 1-based and inclusive
            return util.codeFailure(`Unknown Token '${JSON.stringify(token, null, 4)}`, { documentPath: token.location.documentPath, start: { line: token.location.line, char: token.location.char }, end: { line: token.location.line, char: endChar } });
        }
        
        return util.ok({
            ast: result,
            location: tokenDoc.projectLocation,
            type: 'RootAst'
        });
    }

    return {
        parse,
    };
}

const astParser: IRegisterable = {
    builder: (util: IUtil, internals: IInternals, trimArray: ITrimArray) => buildAstParser(util, internals, trimArray),
    name: 'astParser',
    singleton: false,
    dependencies: ['util', 'internals', 'trimArray']
};

export {
    astParser,
};