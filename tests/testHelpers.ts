import { IProjectLocation, Result } from "../src/types/types.general";
import { IContainer, ITestableContainer } from "../src/types/types.containers";
import { DocumentMap, DocumentParser } from "../src/types/types.document";
import { TokenFunction, TokenizedDocument } from "../src/types/types.tokens";
import { IAstParser, RootAst, IEmpty } from "../src/types/types.ast";
import { IDoculisp, IDoculispParser } from "../src/types/types.astDoculisp";
import { IIncludeBuilder } from "../src/types/types.includeBuilder";
import { IStringWriter } from "../src/types/types.stringWriter"

export function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
    return {
        documentPath: path,
        documentDepth: depth,
        documentIndex: index,
    };
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

function rawAstResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<RootAst[] | IEmpty> {
    const tokenParser = rawTokenResultBuilder(environment, text, location);
    const astParser = buildAstParser(environment);

    return map(tokenParser, astParser.parse);
}

function rawDoculispResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IDoculisp> {
    const tokenResultParser = rawTokenResultBuilder(environment, text, location);
    const astParser = buildDoculispParser(environment);

    return map(tokenResultParser, astParser.parse);
}

function rawAstRecursiveExternalResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<IDoculisp> {
    const astResultParser = rawDoculispResultBuilder(environment, text, location);
    const astRecursiveBuilder = buildIncludeParser(environment);

    return map(astResultParser, astRecursiveBuilder.parseExternals);
}

function rawStringWriterResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<string> {
    const astRecursiveBuilder = rawAstRecursiveExternalResultBuilder(environment, text, location);
    const stringWriter = buildStringWriter(environment);

    return map(astRecursiveBuilder, stringWriter.writeAst);
}

function rawStringWriterPathResultBuilder(environment: ITestableContainer, filePath: string): () => Result<string> {
    const astRecursiveBuilder = buildIncludeParser(environment);
    const stringWriter = buildStringWriter(environment);

    return map(() => astRecursiveBuilder.parse(filePath), stringWriter.writeAst);
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

function newDocumentResultBuilder(container: IContainer): DocumentParser {
    return newBuilder(container, () => {}, environment => {
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

function newIncludeResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (filePath: string) => Result<IDoculisp> {
    return newBuilder(container, setup, environment => {
        return buildIncludeParser(environment).parse;
    });
}

function newTokenResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, location: IProjectLocation) => Result<TokenizedDocument> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawTokenResultBuilder(environment, text, location)(); 
    });
}

function newAstResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<RootAst[] | IEmpty> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstResultBuilder(environment, text, location)();
    });
}

function newDoculispResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawDoculispResultBuilder(environment, text, location)();
    });
}

function newIncludeExternalResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IDoculisp> {
    return newTextToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawAstRecursiveExternalResultBuilder(environment, text, location)();
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

function newStringWriterPathResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (filePath: string) => Result<string> {
    return newBuilder(container, setup, (environment: ITestableContainer) => {
        return (filePath: string): Result<string> => {
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