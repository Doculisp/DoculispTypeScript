<!-- (dl (section-meta Core Pipeline APIs)) -->

This section provides comprehensive API documentation for the core components of the DoculispTypeScript compilation pipeline: DocumentParse, Tokenizer, and AstParser.

<!-- (dl (# DocumentParse API)) -->

The **DocumentParse** is the **first stage** that extracts and processes content from text documents, separating text content from embedded Doculisp blocks.

<!-- (dl (## Overview)) -->

**Primary Responsibilities:**
- Detect file type based on extension (`.md`, `.dlisp`, `.dlproj`)
- Extract Doculisp blocks from HTML comments in markdown files
- Parse pure Doculisp syntax in `.dlisp` files
- Preserve text content alongside extracted structure
- Validate document structure and syntax

<!-- (dl (## Container Registration)) -->

```typescript
{
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'internals', 'util', 'trimArray']
}

// Access from container
const documentParser = container.buildAs<DocumentParser>('documentParse');
```

<!-- (dl (## Core Interface)) -->

```typescript
type DocumentParser = (text: string, projectLocation: IProjectLocation) => Result<DocumentMap>;

interface IProjectLocation {
    readonly documentPath: IPath;      // File path with extension
    readonly documentDepth: number;    // Inclusion nesting level (1+)
    readonly documentIndex: number;    // Document sequence number (1+)
}

type DocumentMap = {
    readonly parts: DocumentPart[];           // Parsed content segments
    readonly projectLocation: IProjectLocation; // Original location context
}

type DocumentPart = IText | ILispBlock;
```

<!-- (dl (## Processing Strategy)) -->

DocumentParse uses different strategies based on file type:

**Markdown Files (.md):**
- Dual content extraction - separates text from embedded Doculisp blocks
- Text content preserved in `IText` parts
- Doculisp blocks extracted from `<!-- (dl ...) -->` comments into `ILispBlock` parts

**Pure Doculisp Files (.dlisp):**
- Pure structure parsing - only Doculisp syntax allowed
- Automatic parenthesis balancing
- All content becomes `ILispBlock` parts

**Project Files (.dlproj):**
- Project structure parsing - similar to `.dlisp` but with project-specific validation
- Must contain `(documents ...)` structure

<!-- (dl (## Basic Usage)) -->

```typescript
async function parseDocument() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Use [Standard Project Location] - see common-patterns.md  
    const projectLocation = {
        documentPath: pathConstructor.buildPath('./example.md'),
        documentDepth: 1,
        documentIndex: 1
    };

    const content = `# My Document\n\n<!-- (dl (section-meta Example)) -->\n\nContent here.`;
    const result = documentParser(content, projectLocation);

    if (result.success) {
        result.value.parts.forEach(part => {
            console.log(`${part.type}: ${part.text}`);
        });
    }
}
```

<!-- (dl (# Tokenizer API)) -->

The **Tokenizer** is the **second stage** that converts parsed document content into structured tokens, transforming Doculisp blocks into individual tokens while preserving text content.

<!-- (dl (## Overview)) -->

**Primary Responsibilities:**
- Convert Doculisp blocks into individual tokens (atoms, parameters, parentheses)
- Preserve text content as text tokens  
- Handle nested parentheses and escape sequences
- Maintain precise location tracking for error reporting

<!-- (dl (## Container Registration)) -->

```typescript
{
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
}

// Access from container
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
```

<!-- (dl (## Core Interface)) -->

```typescript
type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>;

type TokenizedDocument = {
    readonly tokens: Token[];                    // Array of individual tokens
    readonly projectLocation: IProjectLocation; // Original document context
}

type Token = TextToken | CloseParenthesisToken | AtomToken | ParameterToken;
```

<!-- (dl (## Token Types)) -->

**Atom Tokens** - Function names or keywords:
```typescript
// (section-meta) → AtomToken: "section-meta"
// (title My Document) → AtomToken: "title"
type AtomToken = {
    readonly text: string;        // Atom name
    readonly location: ILocation; // Position in source
    readonly type: 'token - atom';
}
```

**Parameter Tokens** - Arguments passed to atoms:
```typescript
// (title My Document Title) → ParameterToken: "My Document Title"
type ParameterToken = {
    readonly text: string;        // Parameter value (processed/unescaped)
    readonly location: ILocation; // Position in source  
    readonly type: 'token - parameter';
}
```

**Text Tokens** - Preserved markdown content:
```typescript
type TextToken = {
    readonly text: string;        // Original text content
    readonly location: ILocation; // Position in source
    readonly type: 'token - text';
}
```

**Parenthesis Tokens** - Structure markers:
```typescript
type CloseParenthesisToken = {
    readonly location: ILocation; // Position in source
    readonly type: 'token - close parenthesis';
}
```

<!-- (dl (## Basic Usage)) -->

```typescript
async function tokenizeDocument() {
    // Use [Standard Container Setup] and [Standard Project Location] - see common-patterns.md
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');

    // Parse document first
    const documentMap = documentParser(content, projectLocation);
    if (!documentMap.success) return;

    // Tokenize the parsed document
    const tokenizedResult = tokenizer(documentMap);
    if (tokenizedResult.success) {
        tokenizedResult.value.tokens.forEach((token, index) => {
            console.log(`Token ${index + 1}: ${token.type} - "${token.text || 'N/A'}"`);
        });
    }
}
```

<!-- (dl (# AstParser API)) -->

The **AstParser** is the **third stage** that converts tokenized content into an Abstract Syntax Tree (AST), providing a structured representation of the document's logical organization.

<!-- (dl (## Overview)) -->

**Primary Responsibilities:**
- Convert token streams into hierarchical AST structures
- Validate Doculisp syntax and structure
- Handle nested expressions and parameter parsing
- Preserve text content and location information
- Detect and report syntax errors

<!-- (dl (## Container Registration)) -->

```typescript
{
    name: 'astParser',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
}

// Access from container  
const astParser = container.buildAs<IAstParser>('astParser');
```

<!-- (dl (## Core Interface)) -->

```typescript
interface IAstParser {
    parse(tokenizedDocument: Result<TokenizedDocument>): Result<RootAst | IAstEmpty>;
}

type RootAst = {
    readonly location: ILocation;
    readonly parts: AstPart[];
    readonly type: 'ast-root';
}

type AstPart = IAstText | IAstExpression;
```

<!-- (dl (## AST Node Types)) -->

**Text Nodes** - Preserved markdown content:
```typescript
interface IAstText {
    readonly text: string;        // Original text content
    readonly location: ILocation; // Position in source
    readonly type: 'ast-text';
}
```

**Expression Nodes** - Doculisp expressions:
```typescript
interface IAstExpression {
    readonly atom: string;         // Function name (e.g., "section-meta")
    readonly parameters: string[]; // Arguments to the function
    readonly location: ILocation;  // Position in source
    readonly parts: AstPart[];     // Nested expressions
    readonly type: 'ast-expression';
}
```

**Empty AST** - For documents with no content:
```typescript
interface IAstEmpty {
    readonly location: ILocation;
    readonly type: 'ast-empty';
}
```

<!-- (dl (## Processing Flow)) -->

The AstParser processes tokens through several stages:

1. **Token Validation**: Ensures proper token sequence and structure
2. **Expression Building**: Groups atoms with their parameters and children  
3. **Hierarchy Construction**: Builds nested expression trees
4. **Text Preservation**: Maintains original text content alongside structure
5. **Location Tracking**: Preserves precise source location information

<!-- (dl (## Basic Usage)) -->

```typescript
async function parseToAst() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const astParser = container.buildAs<IAstParser>('astParser');

    // Use [Standard Pipeline Processing] - see common-patterns.md
    const documentMap = documentParser(content, projectLocation);
    if (!documentMap.success) return;

    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) return;

    const astResult = astParser.parse(tokenizedResult);
    if (astResult.success) {
        if (astResult.value.type === 'ast-root') {
            console.log(`Generated AST with ${astResult.value.parts.length} parts`);
        }
    }
}
```

<!-- (dl (## Error Handling)) -->

All three APIs use consistent error handling with the `Result<T>` pattern:

```typescript
// Validate each stage before proceeding
const documentMap = documentParser(content, location);
if (!documentMap.success) {
    console.error('Document parsing failed:', documentMap.message);
    return;
}

const tokenized = tokenizer(documentMap);
if (!tokenized.success) {
    console.error('Tokenization failed:', tokenized.message);
    return;
}

const ast = astParser.parse(tokenized);
if (!ast.success) {
    console.error('AST parsing failed:', ast.message);
    return;
}
```

<!-- (dl (# Language Server Specific Patterns)) -->

The core pipeline APIs are particularly useful for language server development scenarios:

<!-- (dl (## Position-Based Token Analysis)) -->

Extract tokens at specific cursor positions for IntelliSense and hover features:

```typescript
async function getTokensAtPosition(
    document: string, 
    line: number, 
    character: number, 
    filePath: string
): Promise<Token[]> {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectLocation = {
        documentPath: pathConstructor.buildPath(filePath),
        documentDepth: 1,
        documentIndex: 1
    };

    // Parse and tokenize
    const documentMap = documentParser(document, projectLocation);
    if (!documentMap.success) return [];

    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) return [];

    // Filter tokens at the specific position
    return tokenizedResult.value.tokens.filter(token => {
        const tokenEnd = token.location.char + (token.text?.length || 0);
        return token.location.line === line && 
               token.location.char <= character && 
               character <= tokenEnd;
    });
}
```

<!-- (dl (## Syntax Highlighting Support)) -->

Extract token information for syntax highlighting:

```typescript
async function getSyntaxTokens(document: string, filePath: string): Promise<SyntaxToken[]> {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectLocation = {
        documentPath: pathConstructor.buildPath(filePath),
        documentDepth: 1,
        documentIndex: 1
    };

    const documentMap = documentParser(document, projectLocation);
    if (!documentMap.success) return [];

    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) return [];

    return tokenizedResult.value.tokens.map(token => ({
        type: mapTokenTypeToSyntaxHighlight(token.type),
        range: {
            start: { line: token.location.line - 1, character: token.location.char - 1 },
            end: { 
                line: token.location.line - 1, 
                character: token.location.char - 1 + (token.text?.length || 0)
            }
        },
        text: token.text || ''
    }));
}

function mapTokenTypeToSyntaxHighlight(tokenType: string): string {
    switch (tokenType) {
        case 'token - atom': return 'keyword';
        case 'token - parameter': return 'string'; 
        case 'token - text': return 'comment';
        case 'token - close parenthesis': return 'delimiter';
        default: return 'text';
    }
}

interface SyntaxToken {
    type: string;
    range: { start: { line: number; character: number }, end: { line: number; character: number } };
    text: string;
}
```

<!-- (dl (## Real-time Error Detection)) -->

Use the pipeline for incremental validation without full compilation:

```typescript
async function validateSyntaxOnly(document: string, filePath: string): Promise<ValidationError[]> {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const astParser = container.buildAs<IAstParser>('astParser');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectLocation = {
        documentPath: pathConstructor.buildPath(filePath),
        documentDepth: 1,
        documentIndex: 1
    };

    const errors: ValidationError[] = [];

    // Stage 1: Document structure validation
    const documentMap = documentParser(document, projectLocation);
    if (!documentMap.success) {
        errors.push(createValidationError(documentMap, 'Document structure error'));
        return errors; // Stop on document parse errors
    }

    // Stage 2: Token validation  
    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) {
        errors.push(createValidationError(tokenizedResult, 'Tokenization error'));
        return errors; // Stop on tokenization errors
    }

    // Stage 3: Syntax validation
    const astResult = astParser.parse(tokenizedResult);
    if (!astResult.success) {
        errors.push(createValidationError(astResult, 'Syntax error'));
    }

    return errors;
}

function createValidationError(result: IFail, context: string): ValidationError {
    // Extract line/character from error message if available
    const positionMatch = result.message.match(/Line: (\d+), Char: (\d+)/);
    
    let line = 0, character = 0;
    if (positionMatch) {
        line = parseInt(positionMatch[1]) - 1; // Convert to 0-based
        character = parseInt(positionMatch[2]) - 1; // Convert to 0-based
    }

    return {
        message: `${context}: ${result.message}`,
        severity: 'error',
        range: {
            start: { line, character },
            end: { line, character: character + 1 }
        },
        source: 'doculisp'
    };
}

interface ValidationError {
    message: string;
    severity: 'error' | 'warning' | 'info';
    range: { start: { line: number; character: number }, end: { line: number; character: number } };
    source: string;
}
```

<!-- (dl (## AST Analysis for Code Intelligence)) -->

Use AST analysis for advanced language features:

```typescript
async function analyzeDocumentStructure(document: string, filePath: string): Promise<DocumentAnalysis> {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const astParser = container.buildAs<IAstParser>('astParser');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectLocation = {
        documentPath: pathConstructor.buildPath(filePath),
        documentDepth: 1,
        documentIndex: 1
    };

    // Full pipeline to AST
    const documentMap = documentParser(document, projectLocation);
    if (!documentMap.success) return { structure: [], errors: [documentMap] };

    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) return { structure: [], errors: [tokenizedResult] };

    const astResult = astParser.parse(tokenizedResult);
    if (!astResult.success) return { structure: [], errors: [astResult] };

    if (astResult.value.type === 'ast-empty') {
        return { structure: [], errors: [] };
    }

    // Analyze AST structure
    const analysis = analyzeASTNodes(astResult.value.parts);
    return { structure: analysis, errors: [] };
}

function analyzeASTNodes(astParts: AstPart[]): StructureElement[] {
    const elements: StructureElement[] = [];

    for (const part of astParts) {
        if (part.type === 'ast-expression') {
            elements.push({
                type: 'expression',
                atom: part.atom,
                parameters: part.parameters,
                location: part.location,
                children: analyzeASTNodes(part.parts)
            });
        } else if (part.type === 'ast-text') {
            elements.push({
                type: 'text',
                content: part.text,
                location: part.location,
                children: []
            });
        }
    }

    return elements;
}

interface DocumentAnalysis {
    structure: StructureElement[];
    errors: IFail[];
}

interface StructureElement {
    type: 'expression' | 'text';
    atom?: string;
    parameters?: string[];
    content?: string;
    location: ILocation;
    children: StructureElement[];
}
```

<!-- (dl (## When to Use These APIs)) -->

**Use these APIs directly when:**
- Building syntax analysis tools
- Implementing custom AST processing
- Creating specialized validation tools
- Performance optimization required
- Need fine-grained control over parsing stages
- **Building language servers and IDE extensions**
- **Implementing real-time validation and error reporting**
- **Creating syntax highlighting and IntelliSense features**

**Use higher-level APIs when:**
- Standard document compilation workflows
- File-based processing with includes
- Variable substitution required
- Output generation needed