import { IAst } from "../types.ast";
import { IAstBuilder } from "../types.astBuilder";
import { IRegisterable } from "../types.containers";
import { IProjectLocation, Result } from "../types.general";

function buildAstBuilder() : IAstBuilder {

    function parse(target: Result<{ text: string; projectLocation: IProjectLocation; }>): Result<IAst> {
        throw new Error("Not Yet Implemented");
    }

    function parseExternals(ast: Result<IAst>): Result<IAst> {
        throw new Error("Not Yet Implemented");
    }

    return {
        parse,
        parseExternals,
    };
}

const astBuilder : IRegisterable = {
    builder: () => buildAstBuilder(),
    name: 'astBuilder',
    singleton: true,
    dependencies: ['documentParse', 'tokenizer', 'astParse']
};

export {
    astBuilder
};