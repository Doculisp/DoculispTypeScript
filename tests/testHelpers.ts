import { IAst, IAstParser } from "../src/types.ast";
import { IAstBuilder } from "../src/types.astBuilder";
import { IContainer, ITestableContainer } from "../src/types.containers";
import { DocumentMap, DocumentParser } from "../src/types.document";
import { IProjectLocation, Result } from "../src/types.general";
import { TokenFunction, TokenizedDocument } from "../src/types.tokens";

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

function builder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, buildIt: (environment: ITestableContainer) => T): T {
    if(container.isTestable) {
        throw new Error('Must not be a testable container');
    }

    const environment: ITestableContainer = container.buildTestable();
    environment.restoreAll();
    setup(environment);
    return buildIt(environment);
}

function textToResultBuilder<T>(container: IContainer, setup: (environment: ITestableContainer) => void, buildIt: (environment: ITestableContainer, text: string, location: IProjectLocation) => T): (text: string, location: IProjectLocation) => T {
    return builder(container, setup, environment => {
        return function(text: string, location: IProjectLocation): T {
            return buildIt(environment, text, location);
        }
    });
}

function buildDocumentParser(environment: ITestableContainer): DocumentParser {
    return environment.buildAs<DocumentParser>('documentParse');
}

function buildTokenResultParser(environment: ITestableContainer): TokenFunction {
    return environment.buildAs<TokenFunction>('tokenizer');
}

function buildAstParser(environment: ITestableContainer): IAstParser {
    return environment.buildAs<IAstParser>('astParse');
}

function buildRecursiveAstParser(environment: ITestableContainer) : IAstBuilder {
    return environment.buildAs<IAstBuilder>('astBuilder');
}

function documentResultBuilder(container: IContainer): DocumentParser {
    return builder(container, () => {}, environment => {
        return buildDocumentParser(environment);
    });
}

function tokenResultParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): TokenFunction {
    return builder(container, setup, environment => {
        return buildTokenResultParser(environment);
    });
}

function astParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IAstParser {
    return builder(container, setup, environment => {
        return buildAstParser(environment);
    });
}

function astRecursiveParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IAstBuilder {
    return builder(container, setup, environment => {
        return buildRecursiveAstParser(environment);
    });
}

function astRecursiveResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (filePath: string) => Result<IAst> {
    return builder(container, setup, environment => {
        return buildRecursiveAstParser(environment).parse;
    });
}

function rawTokenResultBuilder(environment: ITestableContainer, text: string, location: IProjectLocation): () => Result<TokenizedDocument> {
    const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
    const tokenParser = buildTokenResultParser(environment);

    return map(docParser, tokenParser);
}

function tokenResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, location: IProjectLocation) => Result<TokenizedDocument> {
    return textToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        return rawTokenResultBuilder(environment, text, location)(); 
    });
}

function astResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IAst> {
    return textToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
        const tokenParser = buildTokenResultParser(environment);
        const astParser = buildAstParser(environment);

        return map(map(docParser, tokenParser), astParser.parse)();
    });
}

function astRecursiveExternalResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IAst> {
    return textToResultBuilder(container, setup, (environment: ITestableContainer, text: string, location: IProjectLocation) => {
        const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
        const tokenParser = buildTokenResultParser(environment);
        const astParser = buildAstParser(environment);
        const astRecursiveBuilder = buildRecursiveAstParser(environment);

        return map(map(map(docParser, tokenParser), astParser.parse), astRecursiveBuilder.parseExternals)();
    });
}

const testable = {
    documentResultBuilder,
    tokenResultParserBuilder,
    tokenResultBuilder,
    astParserBuilder,
    astResultBuilder,
    astRecursiveParserBuilder,
    astRecursiveResultBuilder,
    astRecursiveExternalResultBuilder,
};

export { testable };