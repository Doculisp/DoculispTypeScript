<!-- (dl 
(section-meta
    (title Common Patterns)
    (id api-common-patterns)
)
) -->

This section defines reusable patterns used throughout the DoculispTypeScript API to reduce duplication and improve maintainability.

<!-- (dl (# Container Setup Patterns)) -->

<!-- (dl (## Standard Container Access)) -->

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

<!-- (dl (## Standard Project Location)) -->

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

<!-- (dl (## Standard Pipeline Processing)) -->

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

<!-- (dl (# Error Handling Patterns)) -->

<!-- (dl (## Basic Error Handling)) -->

Standard Result<T> error handling pattern:

```typescript
function handleError(result: IFail): void {
    console.error(`Error: ${result.message}`);
    
    // Check error type for different handling
    if (result.type === 'code-fail') {
        // Location-aware errors have precise position info
        const codeError = result as IFailCode;
        console.error(`At: ${codeError.documentPath.fullName} Line: ${codeError.line}, Char: ${codeError.char}`);
    } else if (result.type === 'general-fail') {
        // General errors are system-level with no location information
        if (result.documentPath) {
            console.error(`Related to: ${result.documentPath.fullName}`);
        }
        // Note: No line/char information available for general errors
    }
}
```

**Referenced as**: `[Basic Error Handling](#basic-error-handling)`

<!-- (dl (## Language Server Error Conversion)) -->

Convert DoculispTypeScript errors to language server diagnostics:

```typescript
function convertToLanguageServerError(result: IFail): Diagnostic {
    let range = { 
        start: { line: 0, character: 0 }, 
        end: { line: 0, character: 0 } 
    };
    
    // Use type property to discriminate between error types
    if (result.type === 'code-fail') {
        // Location-aware errors have direct line/char properties
        const codeError = result as IFailCode;
        range = {
            start: { line: codeError.line - 1, character: codeError.char - 1 }, // Convert to 0-based
            end: { line: codeError.line - 1, character: codeError.char }
        };
    }
    // Note: general-fail errors have NO location information available
    // These represent system-level errors outside the compiler's parsing context

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

<!-- (dl (# Interface Reference)) -->

<!-- (dl (## Common Interfaces)) -->

Frequently used interfaces across examples:

```typescript
// Import error types from doculisp package
import { IFail, IFailCode, IFailGeneral } from 'doculisp';

// Error type structure (for reference)
interface IFailCode {
    readonly message: string;
    readonly documentPath: IPath;
    readonly line: number;      // Always present - precise line number
    readonly char: number;      // Always present - precise character position
    readonly success: false;
    readonly type: "code-fail";
}

interface IFailGeneral {
    readonly message: string;
    readonly success: false;
    readonly documentPath?: IPath | undefined;  // Optional - may not have file context
    readonly type: "general-fail";
    // NOTE: NO line/char properties - these errors occur outside parsing context
}

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