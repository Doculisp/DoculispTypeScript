import { IAst, IAstParser } from "../src/types.ast";
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
    const environment: ITestableContainer = container.buildTestable();
    setup(environment);
    return buildIt(environment);
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

function tokenResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, location: IProjectLocation) => Result<TokenizedDocument> {
    return builder(container, setup, environment => {
        return function (text: string, location: IProjectLocation): Result<TokenizedDocument> {
            const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
            const tokenParser = buildTokenResultParser(environment);
    
            return map(docParser, tokenParser)();
        };
    });
}

function astParserBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): IAstParser {
    return builder(container, setup, environment => {
        return buildAstParser(environment);
    });
}

function astResultBuilder(container: IContainer, setup: (environment: ITestableContainer) => void = () => {}): (text: string, projectLocation: IProjectLocation) => Result<IAst> {
    return builder(container, setup, environment => {
        return function (text: string, location: IProjectLocation): Result<IAst> {
            const docParser = wrapDocumentParser(buildDocumentParser(environment), text, location);
            const tokenParser = buildTokenResultParser(environment);
            const astParser = buildAstParser(environment);

            return map(map(docParser, tokenParser), astParser.parse)();
        }
    });
}

const testable = {
    documentResultBuilder,
    tokenResultParserBuilder,
    tokenResultBuilder,
    astParserBuilder,
    astResultBuilder,
};

export { testable };