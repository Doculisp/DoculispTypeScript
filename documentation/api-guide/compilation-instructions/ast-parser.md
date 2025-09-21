<!-- (dl (section-meta AstParser API Reference)) -->

<!-- (dl (# AstParser API Reference)) -->

The **AstParser** is the **third stage** of the DoculispTypeScript compilation pipeline that converts tokenized input into Abstract Syntax Trees (AST). It parses different token types (text, atoms, commands, containers) into structured AST nodes that represent the logical structure of Doculisp documents.

<!-- (dl (# Integration Patterns)) -->

**AstParser** serves as the **third stage** in the parsing pipeline, consuming Tokenizer output to generate ASTs for further processing:

```typescript
async function parseToAstPipeline(text: string, projectLocation: IProjectLocation): Promise<RootAst | IAstEmpty | null> {
    const container = await containerPromise;
    
    // Stage 1: Parse document structure (DocumentParse)
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const documentMap = documentParser(text, projectLocation);
    
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return null;
    }
    
    // Stage 2: Tokenize the content (Tokenizer)
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const tokenResult = tokenizer(documentMap);
    
    if (!tokenResult.success) {
        console.error('Tokenization failed:', tokenResult.message);
        return null;
    }
    
    // Stage 3: Parse tokens into AST (AstParser)
    const astParser = container.buildAs<IAstParser>('astParser');
    const astResult = astParser.parse(tokenResult);
    
    if (!astResult.success) {
        console.error('AST parsing failed:', astResult.message);
        return null;
    }
    
    // Note: Additional pipeline stages exist beyond AST generation
    return astResult.value;
}
```

<!-- (dl (## Overview)) -->

**AstParser** is the **third stage** in the Doculisp compilation pipeline that processes tokenized input and produces a hierarchical tree structure representing the parsed content. It handles various Doculisp constructs including text content, atoms, commands with parameters, and nested container structures. The parser ensures proper syntax validation and location tracking throughout the parsing process.

**Pipeline Position:** AstParser is stage 3 in the multi-stage compilation pipeline (DocumentParse → Tokenizer → AstParser → ...)

**Primary Responsibilities:**

<!-- (dl (## Container Registration)) -->

Register AstParser with the dependency injection container:

```typescript
{
    name: 'astParser',
    singleton: false,
    dependencies: ['util', 'internals', 'trimArray']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const astParser = container.buildAs<IAstParser>('astParser');
```

<!-- (dl (## Type Definitions)) -->

Understanding the types used by AstParser is essential for working with the generated AST structures.

<!-- (dl (### Core Interface)) -->

```typescript
interface IAstParser {
    parse(tokens: Result<TokenizedDocument>): Result<RootAst | IAstEmpty>;
}
```

The `IAstParser` provides a single `parse` method that transforms tokenized documents into AST structures.

<!-- (dl (### Input Types)) -->

**Primary Input:**

```typescript
// Tokenized document containing parsed tokens
tokens: Result<TokenizedDocument>
```

**TokenizedDocument Structure:**
```typescript
interface TokenizedDocument {
    projectLocation: IProjectLocation;
    tokens: Token[];
}
```

<!-- (dl (### Output Types)) -->

**Return Value:**
```typescript
Result<RootAst | IAstEmpty>
```

**RootAst Structure:**
```typescript
type RootAst = {
    readonly ast: CoreAst[];
    readonly location: IProjectLocation;
    readonly type: 'RootAst';
}
```

**IAstEmpty Structure:**
```typescript
interface IAstEmpty {
    readonly location: IProjectLocation;
    readonly type: 'ast-Empty';
}
```

<!-- (dl (### AST Node Types)) -->

The parser generates various AST node types:

**IAstValue (Text Content):**
```typescript
interface IAstValue {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-value';
}
```

**IAstAtom (Simple Atoms):**
```typescript
interface IAstAtom {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-atom';
}
```

**IAstCommand (Commands with Parameters):**
```typescript
interface IAstCommand {
    readonly value: string;
    readonly location: ILocation;
    readonly parameter: IAstParameter;
    readonly type: 'ast-command';
}
```

**IAstContainer (Nested Structures):**
```typescript
interface IAstContainer {
    readonly value: string;
    readonly location: ILocation;
    readonly subStructure: AtomAst[];
    readonly type: 'ast-container';
}
```

**IAstParameter (Command Parameters):**
```typescript
interface IAstParameter {
    readonly value: string;
    readonly location: ILocation;
    readonly type: 'ast-Parameter';
}
```

<!-- (dl (## Basic Usage)) -->

<!-- (dl (### Simple Parsing)) -->

Parse a tokenized document into an AST:

```typescript
const container = await containerPromise;
const astParser = container.buildAs<IAstParser>('astParser');

// Assume tokenizedDoc is a Result<TokenizedDocument>
const astResult = astParser.parse(tokenizedDoc);

if (astResult.success) {
    if (astResult.value.type === 'RootAst') {
        // Process the AST nodes
        const astNodes = astResult.value.ast;
        astNodes.forEach(node => {
            console.log(`Node type: ${node.type}, Value: ${node.value}`);
        });
    } else {
        // Handle empty document
        console.log('Document is empty');
    }
} else {
    console.error('Parsing failed:', astResult.message);
}
```

<!-- (dl (### Processing Different Node Types)) -->

Handle various AST node types:

```typescript
function processAstNode(node: CoreAst): void {
    switch (node.type) {
        case 'ast-value':
            // Handle text content
            console.log(`Text: ${node.value}`);
            break;
            
        case 'ast-atom':
            // Handle simple atoms
            console.log(`Atom: ${node.value}`);
            break;
            
        case 'ast-command':
            // Handle commands with parameters
            console.log(`Command: ${node.value}, Parameter: ${node.parameter.value}`);
            break;
            
        case 'ast-container':
            // Handle nested containers
            console.log(`Container: ${node.value}`);
            node.subStructure.forEach(processAstNode);
            break;
    }
}
```

<!-- (dl (## Advanced Usage)) -->

<!-- (dl (### Error Handling Patterns)) -->

Robust error handling for AST parsing:

```typescript
function parseWithErrorHandling(tokenizedDoc: Result<TokenizedDocument>): void {
    const astParser = container.buildAs<IAstParser>('astParser');
    
    try {
        const result = astParser.parse(tokenizedDoc);
        
        if (!result.success) {
            console.error(`Parse error: ${result.message}`);
            if (result.documentPath) {
                console.error(`At: ${result.documentPath.fullName}`);
            }
            return;
        }
        
        // Process successful result
        if (result.value.type === 'ast-Empty') {
            console.log('Document contains no parseable content');
        } else {
            console.log(`Parsed ${result.value.ast.length} AST nodes`);
        }
    } catch (error) {
        console.error('Unexpected parsing error:', error);
    }
}
```

<!-- (dl (### AST Traversal)) -->

Deep traversal of AST structures:

```typescript
function traverseAst(ast: CoreAst[], visitor: (node: CoreAst, depth: number) => void, depth = 0): void {
    ast.forEach(node => {
        visitor(node, depth);
        
        if (node.type === 'ast-container') {
            // Recursively traverse container sub-structures
            traverseAst(node.subStructure, visitor, depth + 1);
        }
    });
}

// Usage example
const astResult = astParser.parse(tokenizedDoc);
if (astResult.success && astResult.value.type === 'RootAst') {
    traverseAst(astResult.value.ast, (node, depth) => {
        const indent = '  '.repeat(depth);
        console.log(`${indent}${node.type}: ${node.value}`);
    });
}
```

<!-- (dl (### Location Tracking)) -->

Utilize location information for debugging and error reporting:

```typescript
function reportNodeLocations(ast: CoreAst[]): void {
    ast.forEach(node => {
        const loc = node.location;
        console.log(`${node.type} at ${loc.documentPath.fullName}:${loc.line}:${loc.char}`);
        
        if (node.type === 'ast-container') {
            reportNodeLocations(node.subStructure);
        }
    });
}
```

<!-- (dl (## Integration Patterns)) -->

<!-- (dl (### Pipeline Integration)) -->

**AstParser** serves as the **third stage** in the parsing pipeline, consuming Tokenizer output to generate ASTs for further processing:

```typescript
async function parseToAstPipeline(text: string, projectLocation: IProjectLocation): Promise<RootAst | IAstEmpty | null> {
    const container = await containerPromise;
    
    // Stage 1: Parse document structure (DocumentParse)
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const documentMap = documentParser(text, projectLocation);
    
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return null;
    }
    
    // Stage 2: Tokenize the content (Tokenizer)
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const tokenResult = tokenizer(documentMap);
    
    if (!tokenResult.success) {
        console.error('Tokenization failed:', tokenResult.message);
        return null;
    }
    
    // Stage 3: Parse tokens into AST (AstParser)
    const astParser = container.buildAs<IAstParser>('astParser');
    const astResult = astParser.parse(tokenResult);
    
    if (!astResult.success) {
        console.error('AST parsing failed:', astResult.message);
        return null;
    }
    
    // Note: Additional pipeline stages exist beyond AST generation
    return astResult.value;
}
}
```

<!-- (dl (### Type Guards)) -->

Implement type guards for safe AST processing:

```typescript
function isRootAst(ast: RootAst | IAstEmpty): ast is RootAst {
    return ast.type === 'RootAst';
}

function isAstCommand(node: CoreAst): node is IAstCommand {
    return node.type === 'ast-command';
}

function isAstContainer(node: CoreAst): node is IAstContainer {
    return node.type === 'ast-container';
}

// Usage
const astResult = astParser.parse(tokenizedDoc);
if (astResult.success && isRootAst(astResult.value)) {
    astResult.value.ast.forEach(node => {
        if (isAstCommand(node)) {
            console.log(`Command: ${node.value} with parameter: ${node.parameter.value}`);
        } else if (isAstContainer(node)) {
            console.log(`Container: ${node.value} with ${node.subStructure.length} children`);
        }
    });
}
```

<!-- (dl (## Common Patterns)) -->

<!-- (dl (### Empty Document Handling)) -->

Handle empty documents gracefully:

```typescript
function processAstResult(astResult: Result<RootAst | IAstEmpty>): void {
    if (!astResult.success) {
        throw new Error(`AST parsing failed: ${astResult.message}`);
    }
    
    if (astResult.value.type === 'ast-Empty') {
        console.log('Document is empty - no content to process');
        return;
    }
    
    // Process the AST nodes
    const ast = astResult.value.ast;
    console.log(`Processing ${ast.length} AST nodes`);
    ast.forEach(processAstNode);
}
```

<!-- (dl (### Command Extraction)) -->

Extract specific commands from the AST:

```typescript
function extractCommands(ast: CoreAst[], commandName: string): IAstCommand[] {
    const commands: IAstCommand[] = [];
    
    function extractFromNodes(nodes: CoreAst[]): void {
        nodes.forEach(node => {
            if (node.type === 'ast-command' && node.value === commandName) {
                commands.push(node);
            } else if (node.type === 'ast-container') {
                extractFromNodes(node.subStructure);
            }
        });
    }
    
    extractFromNodes(ast);
    return commands;
}

// Usage
const astResult = astParser.parse(tokenizedDoc);
if (astResult.success && astResult.value.type === 'RootAst') {
    const headerCommands = extractCommands(astResult.value.ast, '#');
    console.log(`Found ${headerCommands.length} header commands`);
}
```

<!-- (dl (## Performance Considerations)) -->

- **Non-singleton**: Each parse operation gets a fresh parser instance
- **Memory efficiency**: AST nodes maintain minimal required data
- **Location tracking**: All nodes include precise location information
- **Error propagation**: Parse errors include detailed location context
- **Lazy evaluation**: Parsing stops at first structural error

<!-- (dl (## Dependencies)) -->

AstParser requires these container dependencies:

- **util**: Core utilities for Result types and location handling
- **internals**: Internal parsing utilities and array parsers
- **trimArray**: Array manipulation utilities for token consumption

<!-- (dl (## Related Components)) -->

- **Tokenizer**: Provides input for AstParser (TokenizedDocument)
- **DocumentParse**: Often consumes AstParser output for further processing
- **AstProject**: Specialized parser for project-level AST structures
- **AstDoculisp**: Specialized parser for Doculisp-specific AST structures