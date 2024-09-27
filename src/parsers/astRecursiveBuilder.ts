import { IAst } from "../types.ast";
import { IAstBuilder } from "../types.astBuilder";
import { IRegisterable } from "../types.containers";
import { IProjectLocation, IUtil, Result } from "../types.general";

function buildAstBuilder(util: IUtil) : IAstBuilder {

    function parse(target: Result<{ text: string; projectLocation: IProjectLocation; }>): Result<IAst> {
        throw new Error("Not Yet Implemented");
    }

    function parseExternals(ast: Result<IAst>): Result<IAst> {
        return ast;
    }

    return {
        parse,
        parseExternals,
    };
}

const astBuilder : IRegisterable = {
    builder: (util: IUtil) => buildAstBuilder(util),
    name: 'astBuilder',
    singleton: true,
    dependencies: ['util', 'documentParse', 'tokenizer', 'astParse']
};

export {
    astBuilder
};