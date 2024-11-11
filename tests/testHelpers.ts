import { ILocation, IProjectLocation, Result, IUtil } from "../src/types/types.general";
import { IContainer, ITestableContainer } from "../src/types/types.containers";
import { DocumentMap, DocumentParser } from "../src/types/types.document";
import { TokenFunction, TokenizedDocument } from "../src/types/types.tokens";
import { IAstParser, RootAst, IAstEmpty } from "../src/types/types.ast";
import { IDoculisp, IDoculispParser, IEmptyDoculisp } from "../src/types/types.astDoculisp";
import { IIncludeBuilder } from "../src/types/types.includeBuilder";
import { IStringWriter } from "../src/types/types.stringWriter"
import { IVariableRetriever, IVariableSaver } from "../src/types/types.variableTable";
import { IPath } from "../src/types/types.filePath";
import { IProjectDocuments, IProjectParser } from "../src/types/types.astProject";
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
    const variableTable = environment.buildAs<IVariableSaver>('variableTable');

    return map(astResultParser, result =>  astParser.parse(result, variableTable));
}

function rawAstRecursiveExternalResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IDoculisp | IEmptyDoculisp> {
    const astResultParser = rawDoculispResultBuilder(environment, text, location);
    const astRecursiveBuilder = buildIncludeParser(environment);
    const variableTable = environment.buildAs<IVariableSaver>('variableTable');

    return map(astResultParser, result => astRecursiveBuilder.parseExternals(result, variableTable));
}

function rawAstProjectParser(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IProjectDocuments> {
    const astResultParser = rawAstResultBuilder(environment, text, location);
    const projectParser = buildProjectParser(environment);

    return map(astResultParser, projectParser.parse);
}

function rawStringWriterResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<string> {
    const includeBuilder = rawAstRecursiveExternalResultBuilder(environment, text, location);
    const stringWriter = buildStringWriter(environment);
    const variableTable = environment.buildAs<IVariableRetriever>('variableTable');

    return map(includeBuilder, result => stringWriter.writeAst(result, variableTable));
}

function rawStringWriterPathResultBuilder(environment: ITestableContainer, filePath: IPath): () => Result<string> {
    const astRecursiveBuilder = buildIncludeParser(environment);
    const stringWriter = buildStringWriter(environment);
    const variableTable = environment.buildAs<IVariableSaver & IVariableRetriever>('variableTable');

    return map(() => astRecursiveBuilder.parse(filePath, variableTable), result => stringWriter.writeAst(result, variableTable));
}

function newBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, buildIt: (environment: ITestableContainer) => T): T {
    if(container.isTestable) {
        throw new Error('Must not be a testable container');
    }

    const environment: ITestableContainer = container.buildTestable();
    environment.restoreAll();
    setup(environment);
    return buildIt(environment);
}

function newTextToResultBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, builderFunction: (environment: ITestableContainer, text: string, location: IProjectLocation) => T): (text: string, location: IProjectLocation) => T {
    return newBuilder(container, setup, environment => {
        return function(text: string, location: IProjectLocation): T {
            return builderFunction(environment, text, location);
        }
    });
}

function newDocumentResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): DocumentParser {
    return newBuilder(container, setup, environment => {
        return buildDocumentParser(environment);
    });
}

function newTokenResultParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): TokenFunction {
    return newBuilder(container, setup, environment => {
        return buildTokenResultParser(environment);
    });
}

function newAstParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IAstParser {
    return newBuilder(container, setup, environment => {
        return buildAstParser(environment);
    });
}

function newDoculispParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IDoculispParser {
    return newBuilder(container, setup, environment => {
        return buildDoculispParser(environment);
    });
}

function newIncludeParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IIncludeBuilder {
    return newBuilder(container, setup, environment => {
        return buildIncludeParser(environment);
    });
}

function newAstProjectBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IProjectParser {
    return newBuilder(container, setup, environment => {
        return buildProjectParser(environment);
    });
}

function newIncludeResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (filePath: IPath) => Result<IDoculisp | IEmptyDoculisp> {
    return newBuilder(container, setup, environment => {
        const variableTable = environment.buildAs<IVariableSaver>('variableTable');
        return path => buildIncludeParser(environment).parse(path, variableTable);
    });
}

function newTokenResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, location: IProjectLocation) => Result<TokenizedDocument> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawTokenResultBuilder(environment, text, location)(); 
    });
}

function newAstResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<RootAst | IAstEmpty> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstResultBuilder(environment, text, location)();
    });
}

function newDoculispResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawDoculispResultBuilder(environment, text, location)();
    });
}

function newIncludeExternalResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp | IEmptyDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstRecursiveExternalResultBuilder(environment, text, location)();
    });
}

function newAstProjectResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IProjectDocuments> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstProjectParser(environment, text, location)();
    });
}

function newStringWriterBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IStringWriter {
    return newBuilder(container, setup, environment => {
        return buildStringWriter(environment);
    });
}

function newStringWriterResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<string> {
    return newTextToResultBuilder(container, setup, (environment, text, location) => {
        return rawStringWriterResultBuilder(environment, text, location)();
    });
}

function newStringWriterPathResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (filePath: IPath) => Result<string> {
    return newBuilder(container, setup, (environment: ITestableContainer) => {
        return (filePath: IPath): Result<string> => {
            const astBuilder = rawStringWriterPathResultBuilder(environment, filePath);
            return astBuilder();
        };
    });
}

const testable = {
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
    },
};

export { testable };