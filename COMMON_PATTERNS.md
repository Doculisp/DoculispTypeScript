<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->

# Common Patterns #

This section defines reusable patterns used throughout the DoculispTypeScript API to reduce duplication and improve maintainability.

## Container Setup Patterns ##

### Standard Container Access ###

Most examples in this guide use this standard container setup pattern:

```typescript
// Standard container initialization pattern
const { containerPromise } = require('doculisp/dist/moduleLoader');
const container = await containerPromise;

// Build core components
const documentParser = container.buildAs<DocumentParser>('documentParse');
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');
```

**Referenced as**: `[Standard Container Setup](#standard-container-access)`

### Standard Project Location ###

Most parsing examples use this project location pattern:

```typescript
// Standard project location for single document processing
const projectLocation = {
    documentPath: pathConstructor.buildPath(filePath),
    documentDepth: 1,
    documentIndex: 1
};
```

**Referenced as**: `[Standard Project Location](#standard-project-location)`

### Standard Pipeline Processing ###

Basic three-stage pipeline processing pattern:

```typescript
// Assumes: [Standard Container Setup] and [Standard Project Location]

// Stage 1: Document parsing
const documentMap = documentParser(content, projectLocation);
if (!documentMap.success) return handleError(documentMap);

// Stage 2: Tokenization
const tokenizedResult = tokenizer(documentMap);
if (!tokenizedResult.success) return handleError(tokenizedResult);

// Stage 3: AST generation
const astResult = astParser.parse(tokenizedResult);
if (!astResult.success) return handleError(astResult);

// Continue with AST processing...
```

**Referenced as**: `[Standard Pipeline Processing](#standard-pipeline-processing)`

## Error Handling Patterns ##

### Basic Error Handling ###

Standard Result<T> error handling pattern:

```typescript
function handleError(result: IFail): void {
    console.error(`Error: ${result.message}`);
    if (result.documentPath) {
        console.error(`At: ${result.documentPath.fullName}`);
    }
}
```

**Referenced as**: `[Basic Error Handling](#basic-error-handling)`

### Language Server Error Conversion ###

Convert DoculispTypeScript errors to language server diagnostics:

```typescript
function convertToLanguageServerError(result: IFail): Diagnostic {
    const positionMatch = result.message.match(/Line: (\d+), Char: (\d+)/);

    let range = {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 }
    };

    if (positionMatch) {
        const line = parseInt(positionMatch[1]) - 1;
        const char = parseInt(positionMatch[2]) - 1;
        range = {
            start: { line, character: char },
            end: { line, character: char + 1 }
        };
    }

    return {
        severity: determineSeverity(result.message),
        range,
        message: result.message,
        source: 'doculisp'
    };
}

function determineSeverity(message: string): 'error' | 'warning' | 'info' {
    if (message.includes('Unknown atom') || message.includes('Circular dependencies')) return 'error';
    if (message.includes('file') || message.includes('path')) return 'warning';
    return 'info';
}
```

**Referenced as**: `[Language Server Error Conversion](#language-server-error-conversion)`

## Interface Reference ##

### Common Interfaces ###

Frequently used interfaces across examples:

```typescript
// Validation interfaces
interface ValidationError {
    severity: 'error' | 'warning' | 'info';
    message: string;
    range: { start: { line: number; character: number }, end: { line: number; character: number } };
    source: string;
}

interface ValidationResult {
    errors: ValidationError[];
}

// Language server interfaces
interface Diagnostic {
    severity: 'error' | 'warning' | 'info';
    range: { start: { line: number; character: number }, end: { line: number; character: number } };
    message: string;
    source: string;
    code?: string;
}

interface CompletionItem {
    label: string;
    kind: string;
    documentation?: string;
    insertText: string;
}

interface DocumentSymbol {
    name: string;
    kind: string;
    range: Range;
    selectionRange: Range;
    children: DocumentSymbol[];
}
```

**Referenced as**: `[Common Interfaces](#common-interfaces)`

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->