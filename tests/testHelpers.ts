import { IContainer, ITestableContainer } from "../src/types.containers";
import { DocumentMap, DocumentParser } from "../src/types.document";
import { IProjectLocation, Result } from "../src/types.general";

export function buildLocation(path: string, depth: number, index: number) : IProjectLocation {
    return {
        documentPath: path,
        documentDepth: depth,
        documentIndex: index,
    };
}

// function map<T1, T2>(f1: () => T1, f2: (value: T1) => T2): () => T2 {
//     return function() {
//         return f2(f1());
//     }
// }

function buildDocumentParser(environment: ITestableContainer) {
    return function(text: string, location: IProjectLocation): Result<DocumentMap> {
        const documentParser: DocumentParser = environment.buildAs<DocumentParser>('documentParse');
        return documentParser(text, location);
    }
}

export function documentResultBuilder(container: IContainer): DocumentParser {
    const environment: ITestableContainer = container.buildTestable();

    return buildDocumentParser(environment);
}

const testable = {
    documentResultBuilder,
};

export { testable };