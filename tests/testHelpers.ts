import { ILocation, IProjectLocation, Result, IUtil } from "../src/types/types.general";
import { IContainer, ITestableContainer } from "../src/types/types.containers";
import { DocumentMap, DocumentParser } from "../src/types/types.document";
import { TokenFunction, TokenizedDocument } from "../src/types/types.tokens";
import { IAstParser, RootAst, IAstEmpty } from "../src/types/types.ast";
import { IDoculisp, IDoculispParser, IEmptyDoculisp } from "../src/types/types.astDoculisp";
import { IIncludeBuilder } from "../src/types/types.includeBuilder";
import { IStringWriter } from "../src/types/types.stringWriter"
import { IVariableTable, sourceKey } from "../src/types/types.variableTable";
import { IPath } from "../src/types/types.filePath";
import { IProjectDocuments, IProjectParser } from "../src/types/types.astProject";
import { IController } from "../src/types/types.controller";
import path from "path";

export function buildProjectLocation(path: string, depth: number = 1, index: number = 1, extension: string | false = false) : IProjectLocation {
    return {
        documentPath: buildPath(path),
        documentDepth: depth,
        documentIndex: index,
    };
}

export function buildLocation(util: IUtil) {
    return function (path: string, depth: number, index: number, line: number, char: number) : ILocation{
        const result: ILocation = util.location(buildPath(path), depth, index, line, char)
        return result as ILocation;
    }
}

export function buildPath(pathString: string, hasExtension: boolean = true): IPath {
    const extension = hasExtension ? path.extname(pathString) : '';
    const containingDir = path.dirname(pathString);
    const result = { 
        fullName: pathString, 
        extension: extension.length > 0 ? extension : false, 
        getContainingDir: () => buildPath(containingDir),
        getRelativeFrom: undefined as any,
        toJSON: () => pathString,
        type: 'path',
        toString: () => pathString,
    };

    return result as any as IPath;
}

function map<T1, T2>(f1: () => T1, f2: (value: T1) => T2): () => T2 {
    return function() {
        return f2(f1());
    }
}

function wrapDocumentParser(parser: DocumentParser, text: string, location: IProjectLocation): () => Result<DocumentMap> {
    return function() {
        return parser(text, location);
    }
}

function buildDocumentParser(environment: ITestableContainer): DocumentParser {
    return environment.buildAs<DocumentParser>('documentParse');
}

function buildTokenResultParser(environment: ITestableContainer): TokenFunction {
    return environment.buildAs<TokenFunction>('tokenizer');
}

function buildAstParser(environment: ITestableContainer): IAstParser {
    return environment.buildAs<IAstParser>('astParser');
}

function buildDoculispParser(environment: ITestableContainer): IDoculispParser {
    return environment.buildAs<IDoculispParser>('astDoculispParse');
}

function buildProjectParser(environment: ITestableContainer): IProjectParser {
    return environment.buildAs<IProjectParser>('astProjectParse');
}

function buildIncludeParser(environment: ITestableContainer) : IIncludeBuilder {
    return environment.buildAs<IIncludeBuilder>('includeBuilder');
}

function buildStringWriter(environment: ITestableContainer): IStringWriter {
    return environment.buildAs<IStringWriter>('stringWriter');
}

function buildController(environment: ITestableContainer): IController {
    return environment.buildAs<IController>('controller');
}

function rawTokenResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<TokenizedDocument> {
    const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
    const tokenParser = buildTokenResultParser(environment);

    return map(docParser, tokenParser);
}

function rawAstResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<RootAst | IAstEmpty> {
    const tokenParser = rawTokenResultBuilder(environment, text, location);
    const astParser = buildAstParser(environment);

    return map(tokenParser, astParser.parse);
}

function rawDoculispResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IDoculisp | IEmptyDoculisp> {
    const astResultParser = rawAstResultBuilder(environment, text, location);
    const astParser = buildDoculispParser(environment);
    const variableTable = environment.buildAs<IVariableTable>('variableTable');

    return map(astResultParser, result =>  astParser.parse(result, variableTable));
}

function rawAstRecursiveExternalResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IDoculisp | IEmptyDoculisp> {
    const astResultParser = rawDoculispResultBuilder(environment, text, location);
    const astRecursiveBuilder = buildIncludeParser(environment);
    const variableTable = environment.buildAs<IVariableTable>('variableTable');

    return map(astResultParser, result => astRecursiveBuilder.parseExternals(result, variableTable));
}

function rawAstProjectParser(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IProjectDocuments> {
    const astResultParser = rawAstResultBuilder(environment, text, location);
    const projectParser = buildProjectParser(environment);
    const variableTable = environment.buildAs<IVariableTable>('variableTable');

    return map(astResultParser, result => projectParser.parse(result, variableTable));
}

function rawStringWriterResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<string> {
    const includeBuilder = rawAstRecursiveExternalResultBuilder(environment, text, location);
    const stringWriter = buildStringWriter(environment);
    const variableTable = environment.buildAs<IVariableTable>('variableTable');

    return map(includeBuilder, result => stringWriter.writeAst(result, variableTable));
}

function rawStringWriterPathResultBuilder(environment: ITestableContainer, filePath: IPath): () => Result<string> {
    const astRecursiveBuilder = buildIncludeParser(environment);
    const stringWriter = buildStringWriter(environment);
    const variableTable = environment.buildAs<IVariableTable>('variableTable');

    variableTable.addValue(sourceKey, { type: 'variable-path', value: filePath });

    return map(() => astRecursiveBuilder.parse(variableTable), result => stringWriter.writeAst(result, variableTable));
}

function rawPathCompileResultBuilder(environment: ITestableContainer): (sourcePath: IPath, destinationPath?: IPath | undefined) => Result<string>[] {
    const controller = buildController(environment);

    return function(sourcePath: IPath, destinationPath?: IPath | undefined) {
        if(!!destinationPath)
            return controller.compile(sourcePath);
        else
            return controller.compile(sourcePath, destinationPath);
    }
}

export interface IHelpBuilder {
    chained: boolean;
    newBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, buildIt: (environment: ITestableContainer) => T): T
}

function builder() {
    return {
        chained: false,
        newBuilder: function newBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, buildIt: (environment: ITestableContainer) => T): T {

            let environment: ITestableContainer | null = null;

            if(!this.chained){
                if(container.isTestable) {
                    throw new Error('Must not be a testable container');
                }

                environment = container.buildTestable();
                environment.restoreAll();
                setup(environment);
            }

            environment = environment ?? (container as ITestableContainer);
            if(!environment.isTestable) {
                throw new Error('Must be a testable container by this point');
            }

            return buildIt(environment);
        }
    } as IHelpBuilder;
}

function newTextToResultBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, builderFunction: (environment: ITestableContainer, text: string, location: IProjectLocation) => T, b: () => IHelpBuilder = builder): (text: string, location: IProjectLocation) => T {
    return b().newBuilder(container, setup, environment => {
        return function(text: string, location: IProjectLocation): T {
            return builderFunction(environment, text, location);
        }
    });
}

function newDocumentResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): DocumentParser {
    return b().newBuilder(container, setup, environment => {
        return buildDocumentParser(environment);
    });
}

function newTokenResultParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): TokenFunction {
    return b().newBuilder(container, setup, environment => {
        return buildTokenResultParser(environment);
    });
}

function newAstParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): IAstParser {
    return b().newBuilder(container, setup, environment => {
        return buildAstParser(environment);
    });
}

function newDoculispParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): IDoculispParser {
    return b().newBuilder(container, setup, environment => {
        return buildDoculispParser(environment);
    });
}

function newIncludeParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): IIncludeBuilder {
    return b().newBuilder(container, setup, environment => {
        return buildIncludeParser(environment);
    });
}

function newAstProjectBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): IProjectParser {
    return b().newBuilder(container, setup, environment => {
        return buildProjectParser(environment);
    });
}

function newIncludeResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (filePath: IPath) => Result<IDoculisp | IEmptyDoculisp> {
    return b().newBuilder(container, setup, environment => {
        return path => {
            const variableTable = environment.buildAs<IVariableTable>('variableTable').createChild();
            variableTable.addValue(sourceKey, { type: 'variable-path', value: path });
            return buildIncludeParser(environment).parse(variableTable)
        };
    });
}

function newTokenResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, location: IProjectLocation) => Result<TokenizedDocument> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawTokenResultBuilder(environment, text, location)(); 
    }, b);
}

function newAstResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, projectLocation: IProjectLocation) => Result<RootAst | IAstEmpty> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstResultBuilder(environment, text, location)();
    }, b);
}

function newDoculispResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawDoculispResultBuilder(environment, text, location)();
    }, b);
}

function newIncludeExternalResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstRecursiveExternalResultBuilder(environment, text, location)();
    }, b);
}

function newAstProjectResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, projectLocation: IProjectLocation) => Result<IProjectDocuments> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstProjectParser(environment, text, location)();
    }, b);
}

function newStringWriterBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): IStringWriter {
    return b().newBuilder(container, setup, environment => {
        return buildStringWriter(environment);
    });
}

function newStringWriterResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (text: string, projectLocation: IProjectLocation) => Result<string> {
    return newTextToResultBuilder(container, setup, (environment, text, location) => {
        return rawStringWriterResultBuilder(environment, text, location)();
    }, b);
}

function newStringWriterPathResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (filePath: IPath) => Result<string> {
    return b().newBuilder(container, setup, (environment: ITestableContainer) => {
        return (filePath: IPath): Result<string> => {
            const astBuilder = rawStringWriterPathResultBuilder(environment, filePath);
            return astBuilder();
        };
    });
}

function newPathCompileResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}, b: () => IHelpBuilder = builder): (sourcePath: IPath, outPutPath?: IPath | undefined) => Result<string>[] {
    return b().newBuilder(container, setup, (environment: ITestableContainer) => {
        return rawPathCompileResultBuilder(environment);
    });
}

function chainSetup(container: IContainer, setup: (environment: ITestableContainer) => void, b: () => IHelpBuilder = builder) {
    let bldr = b();
    return bldr.newBuilder(container, setup, (environment: ITestableContainer) => {
        return function<T>(fn: (env: ITestableContainer, _s: (_: ITestableContainer) => void, tb: () => IHelpBuilder) => T) {
            bldr.chained = true;
            return fn(environment, setup, () => bldr);
        }
    });
}

const testable = {
    advanced: {
        chainSetup
    },
    document: {
        resultBuilder: newDocumentResultBuilder,
    },
    token: {
        parserBuilder: newTokenResultParserBuilder,
        resultBuilder: newTokenResultBuilder,
    },
    ast: {
        parserBuilder: newAstParserBuilder,
        resultBuilder: newAstResultBuilder,
    },
    doculisp: {
        parserBuilder: newDoculispParserBuilder,
        resultBuilder: newDoculispResultBuilder,
    },
    project: {
        parseBuilder: newAstProjectBuilder,
        resultBuilder: newAstProjectResultBuilder,
    },
    include: {
        parserBuilder: newIncludeParserBuilder,
        resultBuilder: newIncludeResultBuilder,
        includeResultBuilder: newIncludeExternalResultBuilder,
    },
    stringWriter: {
        writer: newStringWriterBuilder,
        pathParser: newStringWriterPathResultBuilder,
        resultBuilder: newStringWriterResultBuilder,
        pathCompileResultBuilder: newPathCompileResultBuilder,
    },
};

export { testable };