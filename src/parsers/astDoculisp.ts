import { CoreAst, IAstEmpty, RootAst } from "../types/types.ast";
import { DoculispPart, IDoculisp, IDoculispParser, IEmptyDoculisp, ILoad } from "../types/types.astDoculisp";
import { IRegisterable } from "../types/types.containers";
import { ILocation, IUtil, Result } from "../types/types.general";
import { IInternals, StepParseResult } from "../types/types.internal";
import { ITrimArray } from "../types/types.trimArray";

function buildAstParser(internals: IInternals, util: IUtil, trimArray: ITrimArray): IDoculispParser {

    function parseValue(input: CoreAst[], current: ILocation): StepParseResult<CoreAst[], DoculispPart> {
        if(input.length === 0) {
            return internals.noResultFound();
        }

        const ast = input[0] as CoreAst;

        if(ast.type !== 'ast-value') {
            return internals.noResultFound();
        }

        return util.ok({
            type: 'parse result',
            subResult: {
                type: 'doculisp-write',
                documentOrder: ast.location,
                value: ast.value,
            },
            rest: trimArray.trim(1, input),
            location: current
        });
    }

    function parse(astResult: Result<RootAst | IAstEmpty>): Result<IDoculisp | IEmptyDoculisp> {
        if(!astResult.success) {
            return astResult;
        }

        if(astResult.value.type === 'ast-Empty'){
            return util.ok({ type: 'doculisp-empty' });
        }

        const astRoot = astResult.value;
        
        const parser = internals.createArrayParser<CoreAst, DoculispPart | ILoad>(parseValue);
        const parsed = parser.parse(astRoot.Ast, util.toLocation(astRoot.location, 0, 0));

        if(!parsed.success) {
            return parsed;
        }

        const [result, remaining] = parsed.value;

        if(0 < remaining.remaining.length) {
            const next = remaining.remaining[0] as CoreAst;
            return util.fail(`Unknown atom '${next.value}' at '${next.location.documentPath}' Line: ${next.location.line}, Char: ${next.location.char})`, next.location.documentPath);
        }

        return util.ok({
            projectLocation: astRoot.location,
            section: {
                doculisp: result.filter(d => d.type !== 'doculisp-load') as DoculispPart[],
                include: result.filter(d => d.type === 'doculisp-load') as ILoad[],
                documentOrder: util.toLocation(astRoot.location, 1, 1),
                type: 'doculisp-section'
            },
            type: 'doculisp-root'
        });
    }

    return {
        parse,
    }
}

const doculispParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil, trimArray: ITrimArray) => buildAstParser(internals, util, trimArray),
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray']
};

export {
    doculispParser,
};