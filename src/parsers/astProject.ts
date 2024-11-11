import { IAstEmpty, RootAst } from "../types/types.ast";
import { IProjectDocuments, IProjectParser } from "../types/types.astProject";
import { IRegisterable } from "../types/types.containers";
import { PathConstructor } from "../types/types.filePath";
import { IUtil, Result } from "../types/types.general";
import { IInternals } from "../types/types.internal";
import { ITrimArray } from "../types/types.trimArray";

function buildAstProject(internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor): IProjectParser {
    function parse(tokenResults: Result<RootAst | IAstEmpty>): Result<IProjectDocuments> {
        return util.ok({
            documents: [],
            type: 'project-documents'
        });
    }

    return {
        parse,
    };
}

const doculispParser: IRegisterable = {
    builder: (internals: IInternals, util: IUtil, trimArray: ITrimArray, pathConstructor: PathConstructor) => buildAstProject(internals, util, trimArray, pathConstructor),
    name: 'astProjectParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray', 'pathConstructor']
};

export {
    doculispParser,
};
