<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->
<!-- Written By: GitHub Copilot -->

# DoculispTypeScript API Guide #

### Understanding the Dependency Injection Container and Core Objects ###

## Contents ##

* [Introduction](#introduction)
* [Container Fundamentals](#container-fundamentals)
* [Architecture Overview](#architecture-overview)
* [Core Objects Reference](#core-objects-reference)
* [Parsing Pipeline Overview](#parsing-pipeline-overview)
* [Core Pipeline APIs](#core-pipeline-apis)
* [AstDoculispParser API Reference](#astdoculispparser-api-reference)
* [StringWriter API Reference](#stringwriter-api-reference)
* [Language Server Integration](#language-server-integration)
* [Common Patterns](#common-patterns)
* [Usage Patterns and Examples](#usage-patterns-and-examples)
* [Testing Patterns](#testing-patterns)
* [Advanced Usage](#advanced-usage)

## Introduction ##

The DoculispTypeScript project provides a comprehensive **TypeScript compiler** for the Doculisp documentation language. This API guide covers the **Dependency Injection Container system** and **core compilation pipeline** that powers the compiler.

### What This Guide Covers ###

This guide provides everything you need to work with the DoculispTypeScript API:

- **Container System**: How to access and work with the dependency injection container
- **Core Architecture**: Understanding the compilation pipeline and component interactions
- **Pipeline APIs**: Detailed documentation for DocumentParse, Tokenizer, and AstParser
- **Usage Patterns**: Practical examples and common integration scenarios
- **Advanced Topics**: Performance optimization, testing, and custom extensions

### Who Should Use This Guide ###

**Primary Audience:**
- **Tool Developers**: Building IDE extensions, language servers, or linting tools
- **Integration Developers**: Incorporating Doculisp compilation into existing toolchains
- **Advanced Users**: Needing fine-grained control over the compilation process
- **Contributors**: Working on the DoculispTypeScript project itself

**Alternative Resources:**
- For basic Doculisp usage: See the [User Guide](../user-guide/_main.md)
- For language syntax: See the [Language Specification](../../Lang/AI-Assistant-Codex.md)
- For quick compilation: Use the command-line interface

### Getting Started ###

The fastest way to access the container system with full type safety:

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPathConstructor, IPath } from 'doculisp';

// Always await the container (it's asynchronous)
const container = await containerPromise;

// Build any registered object with full type safety
const controller = container.buildAs<IController>('controller');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const sourcePath: IPath = pathConstructor.buildPath('./docs/readme.dlisp');
const destinationPath: IPath = pathConstructor.buildPath('./README.md');
const results = controller.compile(sourcePath, destinationPath);
```

**Critical**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing container functionality.

### Exported Types ###

**Type Safety**: DoculispTypeScript exports all its TypeScript interfaces and types for enhanced development experience:

```typescript
// Import core types for type-safe development
import {
  // Core interfaces
  IController,
  IPathConstructor,
  IPath,

  // Pipeline types
  DocumentParser,
  TokenFunction,
  IAstParser,
  IDoculispParser,

  // Data types
  Result,
  DocumentMap,
  TokenizedDocument,
  Token,
  IAst,
  IDoculisp,

  // Container types
  IContainer,
  IProjectLocation
} from 'doculisp';
```

**Benefits of Using Exported Types:**
- **IntelliSense Support**: Get autocomplete and parameter hints in your IDE
- **Compile-time Safety**: Catch type mismatches before runtime
- **Better Documentation**: Self-documenting code with clear interfaces
- **Refactoring Safety**: IDE can safely rename and refactor with type information

### Key Concepts ###

**Dependency Injection Container:**
- Manages all compilation components and their dependencies
- Provides type-safe object creation and lifecycle management
- Enables easy testing through dependency replacement
- Automatically resolves complex dependency chains

**Compilation Pipeline:**
- **DocumentParse**: Extracts Doculisp from documents (first stage)
- **Tokenizer**: Converts content to structured tokens (second stage)
- **AstParser**: Builds Abstract Syntax Trees (third stage)
- **Semantic Processing**: Converts AST to Doculisp structures
- **Output Generation**: Produces final markdown documents

**File Type Support:**
- **`.dlproj`**: Project files for batch compilation
- **`.dlisp`**: Pure Doculisp structure files
- **`.md`**: Markdown with embedded Doculisp blocks

### Important Limitations ###

**Variable System Constraints:**
The Doculisp compiler has very limited variable support. The variable table only supports:

- **System-generated string variables**: `source` and `destination` (automatically set during compilation)
- **ID variables**: Used internally for tracking header IDs and ensuring uniqueness

**Custom string variables are NOT supported** - you cannot add arbitrary string variables for use in documents.

### Navigation Guide ###

**Recommended Reading Order:**

1. **[Container Fundamentals](./container-fundamentals.md)** - Start here to understand the foundation
2. **[Architecture Overview](./architecture-overview.md)** - Learn how components work together
3. **[Core Pipeline APIs](./core-pipeline-apis.md)** - Deep dive into the main APIs
4. **[Usage Patterns](./usage-patterns.md)** - See practical examples and patterns

**Reference Sections:**
- **[Core Objects](./core-objects.md)** - Complete container object reference
- **[Pipeline Overview](./parsing-pipeline-overview.md)** - Detailed pipeline documentation
- **[Testing Patterns](./testing-patterns.md)** - Testing strategies and examples
- **[Advanced Usage](./advanced-usage.md)** - Performance optimization and extensions

## Container Fundamentals ##

### Understanding the Container System ###

The DoculispTypeScript project uses a **Dependency Injection (DI) Container** to manage object creation, dependencies, and lifecycle. This container system is the foundation that orchestrates all compilation pipeline components.

#### Why Dependency Injection? ####

The DI container provides several key benefits:

- **Testability**: Easy mocking and replacement of dependencies during testing
- **Modularity**: Clean separation of concerns and loose coupling
- **Lifecycle Management**: Automatic singleton management and dependency resolution
- **Circular Dependency Detection**: Built-in protection against dependency cycles

#### Container Architecture ####

The container system consists of several interfaces that work together:

- **`IContainer`**: Main interface combining dependency management and registration
- **`IDependencyManager`**: Building and retrieving objects
- **`IDependencyContainer`**: Registering new modules
- **`ITestableContainer`**: Testing-specific features like dependency replacement

#### Accessing the Container ####

**Critical**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing the container.

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Always await the container first
const container = await containerPromise;
const parser = container.buildAs<ITokenizer>('tokenizer');
```

The container automatically resolves all dependencies and ensures proper initialization order.

#### Building Objects ####

The primary way to get objects from the container is using the `build` methods:

```typescript
// Build with automatic type inference
const tokenizer = container.build('tokenizer');

// Build with explicit typing (recommended)
const parser = container.buildAs<IAstParser>('astParser');
```

#### Registration Patterns ####

Objects are registered automatically by the module loader, but you can also register manually:

##### Registering Values #####

```typescript
// Register a simple value
container.registerValue(myConfig, 'config');

// Register an object with a name property
const logger = { name: 'logger', log: (msg: string) => console.log(msg) };
container.registerValue(logger);
```

##### Registering Builders #####

```typescript
// Register a builder function
container.registerBuilder(
    (dep1: IDep1, dep2: IDep2) => new MyService(dep1, dep2),
    ['dependency1', 'dependency2'],
    'myService',
    true // singleton
);
```

##### Registration Interface #####

All registered modules implement the `IRegisterable` interface:

```typescript
interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}
```

#### Error Handling ####

The container throws errors for missing modules rather than returning error objects:

```typescript
try {
    const result = container.build('nonExistentModule');
    // Use result directly - it's the actual object, not a Result<T>
} catch (error) {
    console.error('Module not found:', error.message);
}
```

**Note**: Unlike other parts of the Doculisp system that use `Result<T>` patterns, the container throws errors for missing modules or circular dependencies.

#### Circular Dependencies ####

The container automatically detects circular dependencies and throws descriptive errors:

```
Error: Circular dependencies between ("moduleA" => "moduleB" => "moduleA")
```

#### Object Lifecycle ####

Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls

#### TypeScript Integration ####

When using TypeScript, import types from the package:

```typescript
// Import common interface types
import type {
    IController,
    ITokenizer,
    IAstParser,
    IPathConstructor,
    IVariableTable,
    IFileWriter,
    Result
} from 'doculisp/dist/types/types.general';

// Import specific type files as needed
import type { IStringWriter } from 'doculisp/dist/types/types.stringWriter';
import type { IStructure } from 'doculisp/dist/types/types.structure';
```

The main types are organized across several type definition files in the `doculisp/dist/types/` directory.

## Architecture Overview ##

### System Architecture ###

The DoculispTypeScript compilation system follows a **pipeline architecture** where each stage transforms input through specialized processing components. Understanding this architecture is essential for effective use of the API.

#### Pipeline Overview ####

All file types flow through this common sequence:

```
1. Controller Entry Point
    ↓ detects file extension and routes to appropriate pipeline
2. FileHandler Operations
    ↓ loads file content and manages working directory
3. DocumentParse Processing
    ↓ extracts/prepares content based on file type
4. Tokenization
    ↓ converts Doculisp content to token streams
5. AST Generation
    ↓ builds Abstract Syntax Tree from tokens
6. Semantic Parsing
    ↓ converts AST to Doculisp semantic structures
7. Output Generation
    ↓ produces final markdown documents
```

#### File Type Routing ####

The controller automatically selects processing pipelines based on file extension:

| Extension | Pipeline | Purpose |
|-----------|----------|---------|
| `.dlproj` | Project Pipeline | Multi-document batch processing |
| `.dlisp` | Pure Doculisp Pipeline | Structure-only documents |
| `.md` | Markdown Pipeline | Mixed content with embedded Doculisp |

#### Core Processing Components ####

##### Universal Components #####

These components are shared across all pipelines:

- **Controller**: Entry point and orchestration
- **FileHandler**: File I/O and working directory management
- **VariableTable**: System variables and ID tracking
- **IncludeBuilder**: Recursive include processing

##### Pipeline-Specific Components #####

Different file types use specialized processing:

**Project Files (.dlproj):**
- AstProjectParse for project structure
- Batch coordination for multiple documents

**Pure Doculisp Files (.dlisp):**
- Optimized parsing (no HTML extraction)
- Structure-only validation

**Markdown Files (.md):**
- Dual content extraction
- Text preservation alongside Doculisp processing

#### Variable Management ####

The system maintains consistent variable tables across all processing:

##### System Variables #####

- **`' source`** (note leading space): Source file path
- **`' destination`** (note leading space): Output file path
- **Document IDs**: For cross-reference resolution
- **`author`**: Author information for attribution

##### Variable Scope Hierarchy #####

```typescript
// Root table for main document
const rootTable = container.buildAs<IVariableTable>('variableTable');

// Child table for each included document
const childTable = rootTable.createChild();
childTable.addValue(sourceKey, { type: 'variable-path', value: includePath });

// Global ID registration (available to all children)
if (documentId) {
    rootTable.addGlobalValue(documentId, {
        type: 'variable-id',
        headerLinkText: false,
        value: outputPath,
        source: sourcePath
    });
}
```

#### Include Processing ####

Include processing follows a recursive pattern that maintains context:

##### Working Directory Management #####

```typescript
function processFile(filePath: IPath): Result<T> {
    const workingDir = fileHandler.getProcessWorkingDirectory();
    const targetDir = filePath.getContainingDir();

    try {
        fileHandler.setProcessWorkingDirectory(targetDir);
        // Process file with relative paths resolved correctly
        return processContent();
    } finally {
        fileHandler.setProcessWorkingDirectory(workingDir.value);
    }
}
```

**Benefits:**
- Enables relative paths in include statements
- Maintains proper context for nested includes
- Thread-safe with automatic restoration
- Consistent behavior across all file types

##### Include Validation #####

Include processing enforces strict rules:
- Only `.md` and `.dlisp` files can be included
- Circular dependencies are detected and prevented
- Include depth is tracked for proper nesting
- Relative paths resolved from including file's directory

#### Error Handling Strategy ####

All pipeline components use consistent error handling with the `Result<T>` pattern:

```typescript
// Standard error flow
const fileResult = fileHandler.load(path);
if (!fileResult.success) return fileResult;

const parseResult = parser.parse(fileResult.value);
if (!parseResult.success) return parseResult;

// Success case
return util.ok(finalResult);
```

**Error Standards:**
- Include file path and line/character position when available
- Clear description of what failed and why
- Propagate original error context through call stack
- No exceptions thrown - all errors returned as `Result<T>` failures

#### Output Generation ####

After parsing is complete, all pipelines converge on common output generation:

```
Parsed Doculisp Structure
    ↓ passed to writeAst()
StringWriter
    ↓ processes document structure
StringBuilder
    ↓ assembles markdown content
Generated Markdown Output
    ↓ written via Controller._write()
FileHandler
    ↓ saves to destination
Final Markdown File
```

#### Language Server Architecture Considerations ####

For language server implementations, the pipeline architecture can be adapted for real-time processing:

##### Partial Pipeline Processing #####

Language servers can use partial pipeline processing for different features:

```typescript
// For syntax highlighting - use DocumentParse + Tokenizer only
async function getSyntaxTokens(content: string, filePath: string) {
    const documentMap = documentParser(content, projectLocation);
    if (!documentMap.success) return [];

    const tokenizedResult = tokenizer(documentMap);
    return tokenizedResult.success ? tokenizedResult.value.tokens : [];
}

// For validation - use DocumentParse + Tokenizer + AstParser
async function validateSyntax(content: string, filePath: string) {
    const documentMap = documentParser(content, projectLocation);
    if (!documentMap.success) return [documentMap];

    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) return [tokenizedResult];

    const astResult = astParser.parse(tokenizedResult);
    return astResult.success ? [] : [astResult];
}

// For semantic features - use full pipeline including AstDoculispParser
async function getSemanticInfo(content: string, filePath: string) {
    // Full pipeline for complete semantic analysis
    const fullResult = await runFullPipeline(content, filePath);
    return fullResult;
}
```

##### Container Lifecycle for Language Servers #####

Language servers require different container lifecycle management. See [Container Lifecycle](common-patterns.md#container-lifecycle) for the full pattern.

```typescript
class DoculispLanguageServer {
    private container: any;
    private sharedComponents: SharedComponents;

    async initialize() {
        // Use [Standard Container Setup] - see common-patterns.md
        this.container = await containerPromise;

        // Cache singleton components for performance
        this.sharedComponents = {
            documentParser: this.container.buildAs<DocumentParser>('documentParse'),
            tokenizer: this.container.buildAs<TokenFunction>('tokenizer'),
            astParser: this.container.buildAs<IAstParser>('astParser'),
            pathConstructor: this.container.buildAs<IPathConstructor>('pathConstructor')
        };
    }

    // Create document-specific context for each request
    createDocumentContext(): DocumentContext {
        return {
            doculispParser: this.container.buildAs<IDoculispParser>('astDoculispParse'),
            variableTable: this.container.buildAs<IVariableTable>('variableTable'),
            // Non-singleton components get fresh instances
        };
    }
}
}
```

##### Streaming vs Batch Processing #####

Language servers benefit from streaming processing patterns:

**Traditional Batch Processing:**
```typescript
// Compile entire project at once
const results = controller.compile(projectPath);
```

**Language Server Streaming:**
```typescript
// Process individual documents on-demand
async function processDocument(uri: string, content: string) {
    const context = createDocumentContext();
    return await processWithContext(content, uri, context);
}

// Incremental validation as user types
async function validateIncremental(uri: string, content: string, changes: TextChange[]) {
    // Only reprocess changed sections if possible
    const affectedSections = analyzeChanges(changes);
    return await validateSections(content, affectedSections);
}
```

##### Error Handling for Real-time Processing #####

Language servers need enhanced error handling for user experience:

```typescript
interface LanguageServerError extends IFail {
    severity: 'error' | 'warning' | 'info';
    range: { start: Position; end: Position };
    code?: string;
    source: 'doculisp';
}

function convertToLanguageServerError(result: IFail, context?: string): LanguageServerError {
    // Extract position information from error message
    const positionMatch = result.message.match(/Line: (\d+), Char: (\d+)/);

    let range = {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 }
    };

    if (positionMatch) {
        const line = parseInt(positionMatch[1]) - 1; // Convert to 0-based
        const char = parseInt(positionMatch[2]) - 1;
        range = {
            start: { line, character: char },
            end: { line, character: char + 1 }
        };
    }

    return {
        ...result,
        severity: determineSeverity(result.message),
        range,
        code: extractErrorCode(result.message),
        source: 'doculisp'
    };
}
```

#### Performance Characteristics ####

##### Pipeline Efficiency #####

- **Project files**: Highest overhead (multiple document processing) but efficient for batch operations
- **Doculisp files**: Fastest parsing (no HTML extraction) with moderate include overhead
- **Markdown files**: Moderate parsing overhead (dual extraction) with full feature support
- **Language server processing**: Optimized for partial pipeline usage and incremental updates

##### Memory Management #####

- All pipelines use streaming processing to minimize memory footprint
- Include processing loads files on-demand rather than pre-loading
- Variable tables use copy-on-write for efficient child scope management
- Most container objects are singletons - created once and reused
- **Language servers**: Benefit from component caching and document-specific contexts

## Core Objects Reference ##

This section provides a comprehensive reference to all objects available in the DoculispTypeScript container system. Objects are organized by functional category to help you understand their roles in the compilation pipeline.

### High-Level Controllers ###

| Container Key | Interface | Primary Purpose |
|---------------|-----------|-----------------|
| `controller` | `IController` | **Main entry point** - orchestrates entire compilation process |
| `includeBuilder` | `IIncludeBuilder` | **Include coordination** - processes include statements and builds document trees |

**Usage Pattern:**
```typescript
// Most common usage - high-level compilation with full type safety
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPath, Result } from 'doculisp';

const container = await containerPromise;
const controller = container.buildAs<IController>('controller');
const results: Result<string | false>[] = controller.compile(sourcePath, destinationPath);
```

### Core Pipeline Components ###

These objects form the heart of the compilation pipeline, processing documents through sequential transformation stages:

| Container Key | Interface | Pipeline Stage | Transforms |
|---------------|-----------|----------------|------------|
| `documentParse` | `IDocumentParser` | **Stage 1** | Raw text → Document parts |
| `tokenizer` | `ITokenizer` | **Stage 2** | Document parts → Tokens |
| `astParser` | `IAstParser` | **Stage 3** | Tokens → Abstract Syntax Tree |
| `astDoculispParse` | `IAstDoculispParser` | **Stage 4** | AST → Doculisp structures |
| `stringWriter` | `IStringWriter` | **Stage 5** | Doculisp structures → Markdown |

**Usage Pattern:**
```typescript
// Direct pipeline access for custom processing with full type safety
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { DocumentParser, TokenFunction, IAstParser } from 'doculisp';

const container = await containerPromise;
const documentParser = container.buildAs<DocumentParser>('documentParse');
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
```

### Specialized Parsers ###

| Container Key | Interface | Specialized Purpose |
|---------------|-----------|---------------------|
| `astProjectParse` | `IAstProjectParser` | Parses `.dlproj` project configuration files |

### File System and I/O ###

| Container Key | Interface | Functionality |
|---------------|-----------|---------------|
| `fileHandler` | `IFileWriter` | File operations (read, write, exists), working directory management |
| `pathConstructor` | `IPathConstructor` | Creates and manipulates `IPath` objects, path resolution |

**Usage Pattern:**
```typescript
// File system operations with proper typing
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IFileWriter, IPathConstructor, IPath, Result } from 'doculisp';

const container = await containerPromise;
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const path: IPath = pathConstructor.buildPath('./docs/readme.md');
const content: Result<string> = fileHandler.load(path);
```

### Data and State Management ###

| Container Key | Interface | Manages |
|---------------|-----------|---------|
| `variableTable` | `IVariableTable` | System variables (`source`, `destination`), document IDs, cross-references |
| `structure` | `IStructure` | Document structure analysis and relationships |

**Important Variable Limitation:**
The variable table only supports system-generated variables and IDs. Custom string variables are NOT supported.

### Output Generation ###

| Container Key | Interface | Purpose |
|---------------|-----------|---------|
| `stringWriter` | `IStringWriter` | **Primary output generator** - converts Doculisp structures to markdown |
| `stringBuilder` | `IStringBuilder` | **Utility** - efficient string building with formatting |

### Internal Processing Utilities ###

| Container Key | Interface | Internal Purpose |
|---------------|-----------|------------------|
| `internals` | `IInternals` | Internal processing utilities and array parsers |
| `util` | `IUtil` | Core utilities including `Result<T>` helpers |
| `utilBuilder` | `IUtilBuilder` | Utility builders and factory methods |
| `textHelpers` | `ITextHelpers` | Text processing and formatting utilities |
| `trimArray` | `ITrimArray` | Array manipulation utilities for token processing |
| `searches` | `ISearches` | Search and lookup utilities for content analysis |

### System Information ###

| Container Key | Interface | Provides |
|---------------|-----------|----------|
| `version` | `IVersion` | DoculispTypeScript version information |

### Object Lifecycle and Dependencies ###

**Singleton Behavior:**
Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls
- Efficient resource usage

**Exception:** `stringWriter` is NOT a singleton - new instance created per operation for thread safety.

**Dependency Resolution:**
The container automatically resolves dependencies using these patterns:
- Objects specify their dependencies in registration
- Container builds dependencies before dependent objects
- Circular dependency detection prevents infinite loops
- Lazy loading - objects created only when needed

### Key Interface Examples ###

#### IController - Main Entry Point ####

```typescript
interface IController {
    compile(sourcePath: IPath, outputPath?: IPath): Result<string>[];
    test(sourcePaths: IPath[]): Result<string>[];
}

// Usage
const controller = container.buildAs<IController>('controller');
const results = controller.compile(sourcePath, destinationPath);
if (results[0].success) {
    console.log('Compilation successful');
}
```

#### IVariableTable - State Management ####

```typescript
interface IVariableTable {
    getValue<T extends IVariable>(key: string): Result<T>;
    hasKey(key: string): boolean;
    createChild(): IVariableTable;
    addValue(key: string, variable: IVariable): void;
    addGlobalValue(key: string, variable: IVariable): void;
}

// Usage - system variables only
const table = container.buildAs<IVariableTable>('variableTable');
const sourceVar = table.getValue(' source'); // Note: leading space required
```

#### IFileWriter - File Operations ####

```typescript
interface IFileWriter {
    load(path: IPath): Result<string>;
    write(path: IPath, content: string): Result<void>;
    exists(path: IPath): Result<boolean>;
    getProcessWorkingDirectory(): Result<IPath>;
    setProcessWorkingDirectory(path: IPath): void;
}

// Usage
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const content = fileHandler.load(filePath);
```

#### IPathConstructor - Path Management ####

```typescript
interface IPathConstructor {
    buildPath(path: string): IPath;
}

// Usage
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');
const docPath = pathConstructor.buildPath('./docs/readme.md');
```

### Access Patterns ###

**Standard Container Access:**
```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');
const container = await containerPromise;

// Type-safe access (recommended)
const controller = container.buildAs<IController>('controller');

// Untyped access (use sparingly)
const controller = container.build('controller');
```

**Batch Object Creation:**
```typescript
// Efficient when needing multiple objects
const container = await containerPromise;
const [controller, fileHandler, pathConstructor] = [
    container.buildAs<IController>('controller'),
    container.buildAs<IFileWriter>('fileHandler'),
    container.buildAs<IPathConstructor>('pathConstructor')
];
```

## Parsing Pipeline Overview ##

Understanding how Doculisp processes different file types is crucial for working with the system effectively. This overview explains the three distinct parsing pipelines and how they coordinate to transform source documents into compiled markdown.

### Pipeline Architecture ###

Doculisp supports three file types, each with its own specialized pipeline optimized for specific use cases:

#### File Type Overview ####

| File Type | Extension | Purpose | Content Rules |
|-----------|-----------|---------|---------------|
| **Project Files** | `.dlproj` | Multi-document coordination | Project structure definitions only |
| **Pure Doculisp** | `.dlisp` | Structure definitions | Doculisp syntax only - no text content |
| **Markdown Files** | `.md` | Mixed content | Text + embedded Doculisp in HTML comments |

#### Universal Processing Foundation ####

All pipelines share these core processing steps:

```
1. Controller Entry Point
    ↓ detects file extension and routes to appropriate pipeline
2. FileHandler Operations
    ↓ loads file content and manages working directory
3. DocumentParse Processing
    ↓ extracts/prepares content based on file type
4. Tokenization
    ↓ converts Doculisp content to token streams
5. AST Generation
    ↓ builds Abstract Syntax Tree from tokens
6. Semantic Parsing
    ↓ converts AST to Doculisp semantic structures
```

#### Pipeline Selection Logic ####

The controller automatically routes files based on extension:

```typescript
// Primary routing in Controller.compile()
if (sourcePath.extension === '.dlproj') {
    return _compileProject(sourcePath);  // Project pipeline
}

// Standard document processing for .dlisp and .md files
variableTable.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
if (destinationPath) {
    variableTable.addValue(destKey, { type: 'variable-path', value: destinationPath });
}
return [_compile(variableTable)];
```

### Working Directory Management ###

All pipelines implement consistent working directory management for proper relative path resolution:

```typescript
function processFile(filePath: IPath): Result<T> {
    const workingDir = fileHandler.getProcessWorkingDirectory();
    const targetDir = filePath.getContainingDir();

    try {
        fileHandler.setProcessWorkingDirectory(targetDir);
        // Process file with relative paths resolved correctly
        return processContent();
    } finally {
        fileHandler.setProcessWorkingDirectory(workingDir.value);
    }
}
```

**Benefits:**
- Enables relative paths in include statements
- Maintains proper context for nested includes
- Thread-safe with automatic restoration
- Consistent behavior across all file types

### Variable Table Management ###

Variable tables follow consistent patterns across all pipelines to manage document context and cross-references:

#### Core Variables ####

- **`' source`** (note leading space): Source file path
- **`' destination`** (note leading space): Output file path
- **Document IDs**: For cross-reference resolution
- **`author`**: Author information for attribution

#### Table Hierarchy ####

```typescript
// Root table for main document
const rootTable = container.buildAs<IVariableTable>('variableTable');

// Child table for each included document
const childTable = rootTable.createChild();
childTable.addValue(sourceKey, { type: 'variable-path', value: includePath });
childTable.addValue(destKey, { type: 'variable-path', value: outputPath });

// Global ID registration (available to all children)
if (documentId) {
    rootTable.addGlobalValue(documentId, {
        type: 'variable-id',
        headerLinkText: false,
        value: outputPath,
        source: sourcePath
    });
}
```

### Include Processing Pattern ###

Include processing follows the same recursive pattern across `.dlisp` and `.md` files:

```typescript
function parseExternals(doculisp: IDoculisp, variableTable: IVariableTable): Result<IDoculisp> {
    for (const load of doculisp.section.include) {
        // Validate include file extension
        if (load.path.extension !== '.md' && load.path.extension !== '.dlisp') {
            return util.fail(`Invalid file type. Included files must be markdown or dlisp files.`);
        }

        // Recursively parse included file
        const astResult = _parse(load.path, location, variableTable);
        if (!astResult.success) return astResult;

        // Attach parsed content to include structure
        if (astResult.value.type !== 'doculisp-empty') {
            load.document = astResult.value.section;
        }
    }
    return util.ok(doculisp);
}
```

**Include Validation Rules:**
- Only `.md` and `.dlisp` files can be included
- Circular dependencies are detected and prevented
- Include depth is tracked for proper nesting
- Relative paths resolved from including file's directory

### Error Handling Standards ###

All pipelines use consistent error handling with the `Result<T>` pattern:

```typescript
// Standard error flow
const fileResult = fileHandler.load(path);
if (!fileResult.success) return fileResult;

const parseResult = parser.parse(fileResult.value);
if (!parseResult.success) return parseResult;

const astResult = astParser.parse(parseResult.value);
if (!astResult.success) return astResult;

// Success case
return util.ok(finalResult);
```

**Error Message Standards:**
- Include file path and line/character position when available
- Clear description of what failed and why
- Propagate original error context through call stack
- No exceptions thrown - all errors returned as `Result<T>` failures

### Performance Characteristics ###

#### Pipeline Efficiency ####

Each pipeline is optimized for its specific use case:

- **Project files**: Highest overhead (multiple document processing) but efficient for batch operations
- **Doculisp files**: Fastest parsing (no HTML extraction) with moderate include overhead
- **Markdown files**: Moderate parsing overhead (dual extraction) with full feature support

#### Memory Management ####

- Document sections processed sequentially
- Include content loaded on-demand
- Variable tables use copy-on-write for child scopes
- Token streams processed sequentially, not stored entirely in memory

For detailed information about each specific pipeline, see:
- [Project Pipeline Details](./pipeline-details/project-pipeline.md)
- [Doculisp Pipeline Details](./pipeline-details/doculisp-pipeline.md)
- [Markdown Pipeline Details](./pipeline-details/markdown-pipeline.md)

## Core Pipeline APIs ##

This section provides comprehensive API documentation for the core components of the DoculispTypeScript compilation pipeline: DocumentParse, Tokenizer, and AstParser.

### DocumentParse API ###

The **DocumentParse** is the **first stage** that extracts and processes content from text documents, separating text content from embedded Doculisp blocks.

#### Overview ####

**Primary Responsibilities:**
- Detect file type based on extension (`.md`, `.dlisp`, `.dlproj`)
- Extract Doculisp blocks from HTML comments in markdown files
- Parse pure Doculisp syntax in `.dlisp` files
- Preserve text content alongside extracted structure
- Validate document structure and syntax

#### Container Registration ####

```typescript
// Container registration info
{
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'internals', 'util', 'trimArray']
}

// Access from container with proper typing
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { DocumentParser } from 'doculisp';

const container = await containerPromise;
const documentParser = container.buildAs<DocumentParser>('documentParse');
```

#### Core Interface ####

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

#### Processing Strategy ####

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

#### Basic Usage ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    IPathConstructor,
    IProjectLocation,
    DocumentMap,
    Result
} from 'doculisp';

async function parseDocument() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Use [Standard Project Location] - see common-patterns.md
    const projectLocation: IProjectLocation = {
        documentPath: pathConstructor.buildPath('./example.md'),
        documentDepth: 1,
        documentIndex: 1
    };

    const content = `# My Document\n\n<!-- (dl (section-meta Example)) -->\n\nContent here.`;
    const result: Result<DocumentMap> = documentParser(content, projectLocation);

    if (result.success) {
        result.value.parts.forEach(part => {
            console.log(`${part.type}: ${part.text}`);
        });
    }
}
```

### Tokenizer API ###

The **Tokenizer** is the **second stage** that converts parsed document content into structured tokens, transforming Doculisp blocks into individual tokens while preserving text content.

#### Overview ####

**Primary Responsibilities:**
- Convert Doculisp blocks into individual tokens (atoms, parameters, parentheses)
- Preserve text content as text tokens
- Handle nested parentheses and escape sequences
- Maintain precise location tracking for error reporting

#### Container Registration ####

```typescript
// Container registration info
{
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
}

// Access from container with proper typing
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { TokenFunction } from 'doculisp';

const container = await containerPromise;
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
```

#### Core Interface ####

```typescript
type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>;

type TokenizedDocument = {
    readonly tokens: Token[];                    // Array of individual tokens
    readonly projectLocation: IProjectLocation; // Original document context
}

type Token = TextToken | CloseParenthesisToken | AtomToken | ParameterToken;
```

#### Token Types ####

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

#### Basic Usage ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IProjectLocation,
    DocumentMap,
    TokenizedDocument,
    Result
} from 'doculisp';

async function tokenizeDocument() {
    // Use [Standard Container Setup] and [Standard Project Location] - see common-patterns.md
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');

    // Parse document first
    const documentMap: Result<DocumentMap> = documentParser(content, projectLocation);
    if (!documentMap.success) return;

    // Tokenize the parsed document
    const tokenizedResult: Result<TokenizedDocument> = tokenizer(documentMap);
    if (tokenizedResult.success) {
        tokenizedResult.value.tokens.forEach((token, index) => {
            console.log(`Token ${index + 1}: ${token.type} - "${token.text || 'N/A'}"`);
        });
    }
}
```

### AstParser API ###

The **AstParser** is the **third stage** that converts tokenized content into an Abstract Syntax Tree (AST), providing a structured representation of the document's logical organization.

#### Overview ####

**Primary Responsibilities:**
- Convert token streams into hierarchical AST structures
- Validate Doculisp syntax and structure
- Handle nested expressions and parameter parsing
- Preserve text content and location information
- Detect and report syntax errors

#### Container Registration ####

```typescript
{
    name: 'astParser',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
}

// Access from container
const astParser = container.buildAs<IAstParser>('astParser');
```

#### Core Interface ####

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

#### AST Node Types ####

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

#### Processing Flow ####

The AstParser processes tokens through several stages:

1. **Token Validation**: Ensures proper token sequence and structure
2. **Expression Building**: Groups atoms with their parameters and children
3. **Hierarchy Construction**: Builds nested expression trees
4. **Text Preservation**: Maintains original text content alongside structure
5. **Location Tracking**: Preserves precise source location information

#### Basic Usage ####

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

#### Error Handling ####

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

### Language Server Specific Patterns ###

The core pipeline APIs are particularly useful for language server development scenarios:

#### Position-Based Token Analysis ####

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

#### Syntax Highlighting Support ####

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

#### Real-time Error Detection ####

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

#### AST Analysis for Code Intelligence ####

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

#### When to Use These APIs ####

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

## AstDoculispParser API Reference ##

### AstDoculispParser API Reference ###

The **AstDoculispParser** is the **fourth stage** of the DoculispTypeScript compilation pipeline that converts generic Abstract Syntax Trees (AST) into Doculisp-specific structured data. It transforms the parsed AST nodes from AstParser into semantic Doculisp structures that understand the meaning and relationships of Doculisp constructs like headers, sections, includes, and table of contents.

### Integration Patterns ###

**AstDoculispParser** serves as the **fourth stage** in the parsing pipeline, consuming AstParser output to generate Doculisp-specific structures for further processing:

```typescript
async function parseToDoculispPipeline(text: string, projectLocation: IProjectLocation): Promise<IDoculisp | IEmptyDoculisp | null> {
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

    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);

    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }

    // Note: Additional pipeline stages exist beyond Doculisp structure generation
    return doculispResult.value;
}
```

#### Overview ####

**AstDoculispParser** is the **fourth stage** in the Doculisp compilation pipeline that processes generic AST structures and produces semantic Doculisp data structures. It understands the meaning of Doculisp constructs and transforms them into structured objects that can be used for document generation, validation, and manipulation. This parser bridges the gap between syntax (AST) and semantics (Doculisp structures).

**Pipeline Position:** AstDoculispParser is stage 4 in the multi-stage compilation pipeline (DocumentParse → Tokenizer → AstParser → AstDoculispParser → ...)

**Primary Responsibilities:**

- Parse `section-meta` blocks into title and include structures
- Transform dynamic headers (`#`, `##`, etc.) into semantic header objects
- Process `content` blocks and table of contents configurations
- Handle cross-reference links with `get-path` commands
- Validate Doculisp syntax and structure rules
- Manage variable tables for ID tracking and cross-referencing

#### Container Registration ####

Register AstDoculispParser with the dependency injection container:

```typescript
{
    name: 'astDoculispParse',
    singleton: false,
    dependencies: ['internals', 'util', 'trimArray', 'pathConstructor', 'textHelpers']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
```

#### Type Definitions ####

Understanding the types used by AstDoculispParser is essential for working with the generated Doculisp structures.

##### Core Interface #####

```typescript
interface IDoculispParser {
    parse(tokenResults: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): Result<IDoculisp | IEmptyDoculisp>;
}
```

The `IDoculispParser` provides a single `parse` method that transforms AST structures into Doculisp-specific semantic objects.

##### Input Types #####

**Primary Inputs:**

```typescript
// AST result from previous parsing stage
tokenResults: Result<RootAst | IAstEmpty>

// Variable table for ID tracking and cross-references
variableTable: IVariableTable
```

**RootAst Structure (from AstParser):**
```typescript
type RootAst = {
    readonly ast: CoreAst[];
    readonly location: IProjectLocation;
    readonly type: 'RootAst';
}
```

**IVariableTable Interface:**
```typescript
interface IVariableTable {
    hasKey(key: string): boolean;
    getValue(key: string): IVariableValue | undefined;
    addGlobalValue(key: string, value: IVariableValue): void;
    // ... other methods
}
```

##### Output Types #####

**Return Value:**
```typescript
Result<IDoculisp | IEmptyDoculisp>
```

**IDoculisp Structure:**
```typescript
interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter;
    type: 'doculisp-root';
}
```

**ISectionWriter Structure:**
```typescript
interface ISectionWriter extends ILocationSortable {
    readonly doculisp: DoculispPart[];
    readonly include: ILoad[];
    readonly type: 'doculisp-section';
}
```

**IEmptyDoculisp Structure:**
```typescript
interface IEmptyDoculisp {
    readonly type: 'doculisp-empty';
}
```

##### Doculisp Part Types #####

The parser generates various Doculisp-specific structures:

**IWrite (Text Content):**
```typescript
interface IWrite extends ILocationSortable {
    readonly type: 'doculisp-write';
    readonly value: string;
}
```

**ITitle (Section Titles):**
```typescript
interface ITitle extends ILocationSortable {
    readonly type: 'doculisp-title';
    readonly title: string;
    readonly label: string;
    readonly id?: string | undefined;
    readonly ref_link: string;
    readonly subtitle?: string | undefined;
}
```

**IHeader (Dynamic Headers):**
```typescript
interface IHeader extends ILocationSortable {
    readonly type: 'doculisp-header';
    readonly depthCount: number;
    readonly text: string;
    readonly id?: string | undefined;
}
```

**ILoad (Include References):**
```typescript
interface ILoad extends ILocationSortable {
    readonly type: 'doculisp-load';
    readonly path: IPath;
    readonly sectionLabel: string;
    document: ISectionWriter | false; //false means it has not been loaded yet.
}
```

**ITableOfContents (TOC Configuration):**
```typescript
interface ITableOfContents extends ILocationSortable {
    readonly type: 'doculisp-toc';
    readonly label: string | false;
    readonly bulletStyle: DoculispBulletStyle;
}
```

**IContentLocation (Content Placement):**
```typescript
interface IContentLocation extends ILocationSortable {
    readonly type: 'doculisp-content';
}
```

**IPathId (Cross-references):**
```typescript
interface IPathId extends ILocationSortable {
    readonly type: 'doculisp-path-id';
    readonly id: string;
}
```

#### Basic Usage ####

##### Simple Parsing #####

Parse an AST result into Doculisp structures:

```typescript
const container = await containerPromise;
const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume astResult is a Result<RootAst | IAstEmpty> from AstParser
const doculispResult = doculispParser.parse(astResult, variableTable);

if (doculispResult.success) {
    if (doculispResult.value.type === 'doculisp-root') {
        // Process the Doculisp structures
        const section = doculispResult.value.section;

        console.log(`Found ${section.doculisp.length} Doculisp parts`);
        console.log(`Found ${section.include.length} include references`);

        // Process each part
        section.doculisp.forEach(part => {
            console.log(`Part type: ${part.type}`);
        });
    } else {
        // Handle empty document
        console.log('Document is empty');
    }
} else {
    console.error('Doculisp parsing failed:', doculispResult.message);
}
```

##### Processing Different Part Types #####

Handle various Doculisp part types:

```typescript
function processDoculispPart(part: DoculispPart): void {
    switch (part.type) {
        case 'doculisp-write':
            // Handle text content
            console.log(`Text: ${part.value}`);
            break;

        case 'doculisp-header':
            // Handle dynamic headers
            console.log(`Header (depth ${part.depthCount}): ${part.text}`);
            if (part.id) {
                console.log(`  ID: ${part.id}`);
            }
            break;

        case 'doculisp-title':
            // Handle section titles
            console.log(`Title: ${part.title}`);
            console.log(`  Label: ${part.label}`);
            console.log(`  Ref Link: ${part.ref_link}`);
            if (part.subtitle) {
                console.log(`  Subtitle: ${part.subtitle}`);
            }
            break;

        case 'doculisp-toc':
            // Handle table of contents
            console.log(`TOC: ${part.label || 'No label'}`);
            console.log(`  Style: ${part.bulletStyle}`);
            break;

        case 'doculisp-content':
            // Handle content placement markers
            console.log('Content placement marker');
            break;

        case 'doculisp-path-id':
            // Handle cross-references
            console.log(`Cross-reference: ${part.id}`);
            break;
    }
}
```

#### Advanced Usage ####

##### Error Handling Patterns #####

Robust error handling for Doculisp parsing:

```typescript
function parseWithErrorHandling(astResult: Result<RootAst | IAstEmpty>, variableTable: IVariableTable): void {
    const container = await containerPromise;
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');

    try {
        const result = doculispParser.parse(astResult, variableTable);

        if (!result.success) {
            console.error(`Doculisp parse error: ${result.message}`);
            if (result.documentPath) {
                console.error(`At: ${result.documentPath.fullName}`);
            }
            return;
        }

        // Process successful result
        if (result.value.type === 'doculisp-empty') {
            console.log('Document contains no Doculisp content');
        } else {
            console.log(`Parsed Doculisp document with ${result.value.section.doculisp.length} parts`);
        }
    } catch (error) {
        console.error('Unexpected Doculisp parsing error:', error);
    }
}
```

##### Variable Table Management #####

Working with variable tables for cross-references:

```typescript
function parseWithVariableTracking(): void {
    const container = await containerPromise;
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');

    // Parse document with variable tracking
    const result = doculispParser.parse(astResult, variableTable);

    if (result.success && result.value.type === 'doculisp-root') {
        // Check for header IDs that were registered
        result.value.section.doculisp.forEach(part => {
            if (part.type === 'doculisp-header' && part.id) {
                if (variableTable.hasKey(part.id)) {
                    console.log(`Header ID '${part.id}' is available for cross-referencing`);
                }
            }
        });

        // Process cross-references
        result.value.section.doculisp.forEach(part => {
            if (part.type === 'doculisp-path-id') {
                if (variableTable.hasKey(part.id)) {
                    console.log(`Found cross-reference to '${part.id}'`);
                } else {
                    console.warn(`Cross-reference to undefined ID '${part.id}'`);
                }
            }
        });
    }
}
```

##### Structure Analysis #####

Analyze document structure and hierarchy:

```typescript
function analyzeDocumentStructure(doculisp: IDoculisp): void {
    const analysis = {
        titles: 0,
        headers: 0,
        includes: 0,
        tocs: 0,
        crossRefs: 0,
        maxHeaderDepth: 0,
        headersByDepth: {} as Record<number, number>
    };

    // Analyze Doculisp parts
    doculisp.section.doculisp.forEach(part => {
        switch (part.type) {
            case 'doculisp-title':
                analysis.titles++;
                break;
            case 'doculisp-header':
                analysis.headers++;
                analysis.maxHeaderDepth = Math.max(analysis.maxHeaderDepth, part.depthCount);
                analysis.headersByDepth[part.depthCount] = (analysis.headersByDepth[part.depthCount] || 0) + 1;
                break;
            case 'doculisp-toc':
                analysis.tocs++;
                break;
            case 'doculisp-path-id':
                analysis.crossRefs++;
                break;
        }
    });

    // Analyze includes
    analysis.includes = doculisp.section.include.length;

    console.log('Document structure analysis:', analysis);

    // Validate structure
    if (analysis.titles > 1) {
        console.warn('Multiple titles found - only one title per document is recommended');
    }

    if (analysis.includes > 0 && analysis.tocs === 0) {
        console.warn('Document has includes but no table of contents');
    }
}
```

#### Doculisp Structure Patterns ####

##### Section Meta Processing #####

Understanding how section-meta blocks are processed:

```typescript
// Input AST (conceptual)
const sectionMetaAst = {
    type: 'ast-container',
    value: 'section-meta',
    subStructure: [
        { type: 'ast-command', value: 'title', parameter: { value: 'My Section' } },
        { type: 'ast-command', value: 'subtitle', parameter: { value: 'A comprehensive guide' } },
        { type: 'ast-command', value: 'author', parameter: { value: 'John Doe' } },
        { type: 'ast-command', value: 'id', parameter: { value: 'my-document' } },
        {
            type: 'ast-container',
            value: 'include',
            subStructure: [
                { type: 'ast-command', value: 'Section-One', parameter: { value: './section1.md' } },
                { type: 'ast-command', value: 'Section-Two', parameter: { value: './section2.md' } }
            ]
        }
    ]
};

// Resulting Doculisp structures
const resultingStructures = [
    {
        type: 'doculisp-title',
        title: 'My Section',
        subtitle: 'A comprehensive guide',
        label: '# My Section',
        ref_link: '#my-section',
        id: 'my-section'
    },
    {
        type: 'doculisp-load',
        sectionLabel: 'Section One',
        path: './section1.md'
    },
    {
        type: 'doculisp-load',
        sectionLabel: 'Section Two',
        path: './section2.md'
    }
];
```

##### Dynamic Header Processing #####

How dynamic headers are transformed:

```typescript
// Input AST
const headerAst = {
    type: 'ast-command',
    value: '##',
    parameter: { value: 'Installation Guide' }
};

// Resulting Doculisp structure
const headerStructure = {
    type: 'doculisp-header',
    depthCount: 3, // documentDepth (1) + header level (2) = 3
    text: 'Installation Guide',
    id: undefined // No ID specified
};

// With ID specified
const headerWithIdAst = {
    type: 'ast-command',
    value: '##installation',
    parameter: { value: 'Installation Guide' }
};

const headerWithIdStructure = {
    type: 'doculisp-header',
    depthCount: 3,
    text: 'Installation Guide',
    id: 'installation'
};
```

##### Table of Contents Processing #####

How content and TOC blocks are processed:

```typescript
// Input AST
const contentAst = {
    type: 'ast-container',
    value: 'content',
    subStructure: [
        {
            type: 'ast-container',
            value: 'toc',
            subStructure: [
                { type: 'ast-command', value: 'label', parameter: { value: 'Table of Contents' } },
                { type: 'ast-command', value: 'style', parameter: { value: 'numbered-labeled' } }
            ]
        }
    ]
};

// Resulting Doculisp structures
const contentStructures = [
    {
        type: 'doculisp-content'
    },
    {
        type: 'doculisp-toc',
        label: 'Table of Contents',
        bulletStyle: 'numbered-labeled'
    }
];
```

#### Integration Patterns ####

##### Pipeline Integration #####

**AstDoculispParser** serves as the **fourth stage** in the parsing pipeline, consuming AstParser output to generate Doculisp structures for further processing:

```typescript
async function parseToDoculispPipeline(text: string, projectLocation: IProjectLocation): Promise<IDoculisp | IEmptyDoculisp | null> {
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

    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);

    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }

    // Note: Additional pipeline stages exist beyond Doculisp structure generation
    return doculispResult.value;
}
```

##### Type Guards #####

Implement type guards for safe Doculisp structure processing:

```typescript
function isDoculispRoot(result: IDoculisp | IEmptyDoculisp): result is IDoculisp {
    return result.type === 'doculisp-root';
}

function isDoculispTitle(part: DoculispPart): part is ITitle {
    return part.type === 'doculisp-title';
}

function isDoculispHeader(part: DoculispPart): part is IHeader {
    return part.type === 'doculisp-header';
}

function isDoculispToc(part: DoculispPart): part is ITableOfContents {
    return part.type === 'doculisp-toc';
}

// Usage
const doculispResult = doculispParser.parse(astResult, variableTable);
if (doculispResult.success && isDoculispRoot(doculispResult.value)) {
    doculispResult.value.section.doculisp.forEach(part => {
        if (isDoculispTitle(part)) {
            console.log(`Title: ${part.title} (ID: ${part.id || 'none'})`);
        } else if (isDoculispHeader(part)) {
            console.log(`Header (${part.depthCount}): ${part.text}`);
        } else if (isDoculispToc(part)) {
            console.log(`TOC: ${part.label} (${part.bulletStyle})`);
        }
    });
}
```

#### Common Patterns ####

##### Empty Document Handling #####

Handle empty documents gracefully:

```typescript
function processDoculispResult(doculispResult: Result<IDoculisp | IEmptyDoculisp>): void {
    if (!doculispResult.success) {
        throw new Error(`Doculisp parsing failed: ${doculispResult.message}`);
    }

    if (doculispResult.value.type === 'doculisp-empty') {
        console.log('Document is empty - no Doculisp content to process');
        return;
    }

    // Process the Doculisp structures
    const doculisp = doculispResult.value;
    console.log(`Processing document with ${doculisp.section.doculisp.length} parts`);
    doculisp.section.doculisp.forEach(processDoculispPart);
}
```

##### Structure Extraction #####

Extract specific structures from the Doculisp result:

```typescript
function extractStructures(doculisp: IDoculisp) {
    const structures = {
        titles: doculisp.section.doculisp.filter(isDoculispTitle),
        headers: doculisp.section.doculisp.filter(isDoculispHeader),
        tocs: doculisp.section.doculisp.filter(isDoculispToc),
        includes: doculisp.section.include
    };

    return structures;
}

// Usage
const doculispResult = doculispParser.parse(astResult, variableTable);
if (doculispResult.success && doculispResult.value.type === 'doculisp-root') {
    const structures = extractStructures(doculispResult.value);

    console.log(`Found ${structures.titles.length} titles`);
    console.log(`Found ${structures.headers.length} headers`);
    console.log(`Found ${structures.tocs.length} TOCs`);
    console.log(`Found ${structures.includes.length} includes`);
}
```

##### Cross-Reference Resolution #####

Work with cross-references and variable tables:

```typescript
function resolveCrossReferences(doculisp: IDoculisp, variableTable: IVariableTable): void {
    const crossRefs = doculisp.section.doculisp.filter(part => part.type === 'doculisp-path-id') as IPathId[];

    crossRefs.forEach(ref => {
        if (variableTable.hasKey(ref.id)) {
            const variable = variableTable.getValue(ref.id);
            console.log(`Cross-reference '${ref.id}' resolves to:`, variable);
        } else {
            console.warn(`Unresolved cross-reference: '${ref.id}'`);
        }
    });
}
```

#### Performance Considerations ####

- **Non-singleton**: Each parse operation gets a fresh parser instance
- **Variable table management**: Ensure proper variable table initialization and cleanup
- **Memory efficiency**: Doculisp structures maintain minimal required data
- **Location tracking**: All structures include precise location information for debugging
- **Error propagation**: Parse errors include detailed semantic context

#### Dependencies ####

AstDoculispParser requires these container dependencies:

- **internals**: Internal parsing utilities and array parsers
- **util**: Core utilities for Result types and location handling
- **trimArray**: Array manipulation utilities for AST consumption
- **pathConstructor**: Path construction utilities for include processing
- **textHelpers**: Text manipulation utilities for link generation

#### Related Components ####

- **AstParser**: Provides input for AstDoculispParser (RootAst structures)
- **VariableTable**: Manages ID tracking and cross-reference resolution
- **IncludeBuilder**: Often consumes AstDoculispParser output for include processing
- **Controller**: High-level API that orchestrates AstDoculispParser with other components
- **DocumentGenerator**: Uses Doculisp structures for final document generation

## StringWriter API Reference ##

### StringWriter API Reference ###

The **StringWriter** is the **final stage** of the DoculispTypeScript compilation pipeline that converts Doculisp-specific structured data into final markdown output. It transforms the semantic Doculisp structures from AstDoculispParser into properly formatted markdown documents with generated headers, cross-reference resolution, table of contents, and include processing.

### Integration Patterns ###

**StringWriter** serves as the **final stage** in the parsing pipeline, consuming AstDoculispParser output to generate the final markdown documents:

```typescript
async function compileToMarkdownPipeline(text: string, projectLocation: IProjectLocation): Promise<string | null> {
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

    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);

    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }

    // Stage 5: Generate final markdown (StringWriter)
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');
    const markdownResult = stringWriter.writeAst(doculispResult, variableTable);

    if (!markdownResult.success) {
        console.error('Markdown generation failed:', markdownResult.message);
        return null;
    }

    // Final markdown output ready for file writing
    return markdownResult.value;
}
```

#### Overview ####

**StringWriter** is the **final stage** in the Doculisp compilation pipeline that processes semantic Doculisp structures and produces the final markdown output. It handles all aspects of markdown generation including document headers, content formatting, table of contents generation, cross-reference resolution, include processing, and author attribution. This component bridges the gap between semantic structures and the final human-readable markdown documents.

**Pipeline Position:** StringWriter is stage 5 (final) in the multi-stage compilation pipeline (DocumentParse → Tokenizer → AstParser → AstDoculispParser → StringWriter)

**Primary Responsibilities:**

- Generate markdown from Doculisp semantic structures
- Add standard document headers and metadata
- Process includes and merge content from multiple sources
- Generate table of contents with various formatting styles
- Resolve cross-references and path links
- Handle text content preservation for mixed markdown/Doculisp files
- Manage author attribution and document metadata
- Apply proper markdown formatting and spacing

#### Container Registration ####

Register StringWriter with the dependency injection container:

```typescript
{
    name: 'stringWriter',
    singleton: false,
    dependencies: ['util', 'stringBuilder']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const stringWriter = container.buildAs<IStringWriter>('stringWriter');
```

#### Type Definitions ####

Understanding the types used by StringWriter is essential for working with markdown generation.

##### Core Interface #####

```typescript
interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string>;
}
```

The `IStringWriter` provides a single `writeAst` method that transforms Doculisp structures into final markdown strings.

##### Input Types #####

**Primary Inputs:**

```typescript
// Doculisp structures from previous parsing stage
astMaybe: Result<IDoculisp | IEmptyDoculisp>

// Variable table for cross-references, authors, and metadata
variableTable: IVariableTable
```

**IDoculisp Structure (from AstDoculispParser):**
```typescript
interface IDoculisp {
    projectLocation: IProjectLocation;
    section: ISectionWriter;
    type: 'doculisp-root';
}
```

**ISectionWriter Structure:**
```typescript
interface ISectionWriter extends ILocationSortable {
    readonly doculisp: DoculispPart[];
    readonly include: ILoad[];
    readonly type: 'doculisp-section';
}
```

**IVariableTable Interface:**
```typescript
interface IVariableTable {
    getValue<T>(key: string): T | undefined;
    hasKey(key: string): boolean;
    // Used for author information, path references, etc.
}
```

##### Output Types #####

**Return Value:**
```typescript
Result<string>
```

The output is a complete markdown document as a string, including:
- Generated document headers and metadata
- Processed content from all Doculisp structures
- Resolved includes and cross-references
- Formatted table of contents
- Author attribution
- Standard markdown formatting

**Generated Markdown Structure:**
```markdown
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Author Name -->

[Document Content Here]

<!-- Written By: Author Name -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
```

#### Basic Usage ####

##### Simple Markdown Generation #####

Generate markdown from Doculisp structures:

```typescript
const container = await containerPromise;
const stringWriter = container.buildAs<IStringWriter>('stringWriter');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume doculispResult is a Result<IDoculisp | IEmptyDoculisp> from AstDoculispParser
const markdownResult = stringWriter.writeAst(doculispResult, variableTable);

if (markdownResult.success) {
    console.log('Generated markdown:');
    console.log(markdownResult.value);

    // Write to file or process further
    fs.writeFileSync('./output.md', markdownResult.value);
} else {
    console.error('Markdown generation failed:', markdownResult.message);
}
```

##### Handling Empty Documents #####

Process empty documents gracefully:

```typescript
function generateMarkdown(doculispResult: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): string {
    const container = await containerPromise;
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');

    const markdownResult = stringWriter.writeAst(doculispResult, variableTable);

    if (!markdownResult.success) {
        throw new Error(`Markdown generation failed: ${markdownResult.message}`);
    }

    if (doculispResult.success && doculispResult.value.type === 'doculisp-empty') {
        // Empty documents still get generated headers and metadata
        console.log('Generated markdown for empty document');
    }

    return markdownResult.value;
}
```

#### Advanced Usage ####

##### Error Handling Patterns #####

Robust error handling for markdown generation:

```typescript
function generateWithErrorHandling(doculispResult: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): void {
    const container = await containerPromise;
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');

    try {
        const result = stringWriter.writeAst(doculispResult, variableTable);

        if (!result.success) {
            console.error(`Markdown generation error: ${result.message}`);
            if (result.documentPath) {
                console.error(`At: ${result.documentPath.fullName}`);
            }
            return;
        }

        // Process successful result
        const markdown = result.value;
        const lineCount = markdown.split('\n').length;
        const charCount = markdown.length;

        console.log(`Generated ${lineCount} lines (${charCount} characters) of markdown`);

    } catch (error) {
        console.error('Unexpected markdown generation error:', error);
    }
}
```

##### Author Attribution #####

Working with author information in variable tables:

```typescript
function setupAuthorInformation(variableTable: IVariableTable): void {
    // Authors are typically added during section-meta processing
    // But can be manually added for testing or custom scenarios

    const authors = [
        { type: 'variable-string', value: 'John Doe' },
        { type: 'variable-string', value: 'Jane Smith' }
    ];

    variableTable.addValue('author', {
        type: 'variable-string-array',
        value: authors
    });
}

function generateWithAuthors(): void {
    const container = await containerPromise;
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');
    const variableTable = container.buildAs<IVariableTable>('variableTable');

    // Setup author information
    setupAuthorInformation(variableTable);

    // Generate markdown - authors will be included in headers and footers
    const result = stringWriter.writeAst(doculispResult, variableTable);

    if (result.success) {
        // The markdown will include:
        // <!-- Written By: John Doe -->
        // <!-- Written By: Jane Smith -->
        console.log('Generated markdown with author attribution');
    }
}
```

##### Cross-Reference Resolution #####

Understanding how cross-references are resolved:

```typescript
function setupCrossReferences(variableTable: IVariableTable): void {
    // Cross-references are typically added during header processing
    // Each header with an ID gets added to the variable table

    variableTable.addGlobalValue('installation-guide', {
        type: 'variable-id',
        value: './docs/install.md',
        source: someLocation,
        headerLinkText: 'installation-guide'
    });

    variableTable.addGlobalValue('api-reference', {
        type: 'variable-id',
        value: './docs/api.md',
        source: someLocation,
        headerLinkText: 'api-reference'
    });
}

// When StringWriter encounters a doculisp-path-id element:
// (get-path installation-guide) becomes a link to the resolved path
```

#### Markdown Generation Features ####

##### Document Structure Processing #####

Understanding how different Doculisp elements are converted to markdown:

```typescript
// Section titles become markdown headers
const titleExample = {
    type: 'doculisp-title',
    title: 'My Section',
    label: '# My Section #',
    subtitle: 'A comprehensive guide'
};
// Generates:
// # My Section #
//
// ### A comprehensive guide ###

// Dynamic headers become markdown headers
const headerExample = {
    type: 'doculisp-header',
    depthCount: 3,
    text: 'Installation Guide'
};
// Generates: ### Installation Guide ###

// Text content is preserved as-is
const textExample = {
    type: 'doculisp-write',
    value: 'This is regular text content.'
};
// Generates: This is regular text content.
```

##### Table of Contents Generation #####

How table of contents are generated:

```typescript
const tocExample = {
    type: 'doculisp-toc',
    label: 'Table of Contents',
    bulletStyle: 'numbered-labeled'
};

// With includes like:
const includesExample = [
    { sectionLabel: 'Introduction', path: './intro.md' },
    { sectionLabel: 'Getting Started', path: './start.md' }
];

// Generates:
// ## Table of Contents ##
// 1. Introduction: [Introduction](#introduction)
// 2. Getting Started: [Getting Started](#getting-started)
```

##### Include Processing #####

How included content is merged:

```typescript
// Content blocks trigger include processing
const contentExample = {
    type: 'doculisp-content'
};

// StringWriter processes all includes in the section:
// - Recursively processes each included document
// - Merges the generated markdown
// - Maintains proper spacing and formatting
// - Handles nested includes appropriately
```

#### Integration Patterns ####

##### Pipeline Integration #####

**StringWriter** serves as the **final stage** in the parsing pipeline, consuming AstDoculispParser output to generate the final markdown documents:

```typescript
async function completeCompilationPipeline(text: string, projectLocation: IProjectLocation): Promise<string | null> {
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

    // Stage 4: Parse AST into Doculisp structures (AstDoculispParser)
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    const doculispResult = doculispParser.parse(astResult, variableTable);

    if (!doculispResult.success) {
        console.error('Doculisp parsing failed:', doculispResult.message);
        return null;
    }

    // Stage 5: Generate final markdown (StringWriter)
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');
    const markdownResult = stringWriter.writeAst(doculispResult, variableTable);

    if (!markdownResult.success) {
        console.error('Markdown generation failed:', markdownResult.message);
        return null;
    }

    // Complete pipeline - ready for file output
    return markdownResult.value;
}
```

##### High-Level Controller Integration #####

StringWriter is typically accessed through the Controller API:

```typescript
// High-level usage through Controller
const container = await containerPromise;
const controller = container.buildAs<IController>('controller');

// Controller handles the entire pipeline internally
const compileResults = controller.compile('./source.dlisp', './output.md');

// For custom processing, access StringWriter directly
const stringWriter = container.buildAs<IStringWriter>('stringWriter');
const customResult = stringWriter.writeAst(doculispStructures, variableTable);
```

#### Common Patterns ####

##### Batch Processing #####

Process multiple documents efficiently:

```typescript
async function processBatch(documents: Array<{doculisp: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable}>) {
    const container = await containerPromise;
    const stringWriter = container.buildAs<IStringWriter>('stringWriter');

    const results = [];
    for (const doc of documents) {
        const result = stringWriter.writeAst(doc.doculisp, doc.variableTable);
        results.push(result);
    }

    return results;
}
```

##### Content Analysis #####

Analyze generated markdown:

```typescript
function analyzeGeneratedMarkdown(markdown: string): void {
    const lines = markdown.split('\n');
    const analysis = {
        totalLines: lines.length,
        headerLines: lines.filter(line => line.trim().startsWith('#')).length,
        linkCount: (markdown.match(/\[.*?\]\(.*?\)/g) || []).length,
        codeBlocks: (markdown.match(/```[\s\S]*?```/g) || []).length,
        hasAuthors: markdown.includes('Written By:'),
        hasGeneratedHeaders: markdown.includes('GENERATED DOCUMENT DO NOT EDIT')
    };

    console.log('Markdown analysis:', analysis);
}
```

##### Custom Formatting #####

StringWriter handles standard formatting, but you can post-process if needed:

```typescript
function postProcessMarkdown(markdown: string): string {
    // StringWriter generates standard markdown
    // Apply custom post-processing if needed

    return markdown
        .replace(/<!-- Custom processing patterns -->/g, '')
        .trim();
}
```

#### Performance Considerations ####

- **Non-singleton**: Each generation gets a fresh StringWriter instance
- **StringBuilder efficiency**: Uses StringBuilder for efficient string construction
- **Memory management**: Processes includes iteratively to manage memory usage
- **Variable table optimization**: Efficient cross-reference lookup through variable table
- **Content ordering**: Maintains proper document order based on location information
- **Spacing algorithms**: Intelligent spacing between different content types

#### Dependencies ####

StringWriter requires these container dependencies:

- **util**: Core utilities for Result types and location handling
- **stringBuilder**: Efficient string construction for markdown assembly

#### Related Components ####

- **AstDoculispParser**: Provides input for StringWriter (IDoculisp structures)
- **StringBuilder**: Used internally for efficient markdown string construction
- **VariableTable**: Provides cross-reference resolution and author information
- **Controller**: High-level API that orchestrates StringWriter with other components
- **FileHandler**: Often consumes StringWriter output for final file writing
- **IncludeBuilder**: Processes includes that StringWriter then merges into final output

## Language Server Integration ##

This section provides focused guidance for building language servers that integrate with DoculispTypeScript. It emphasizes the key differences from batch compilation and provides essential patterns.

### Key Integration Principles ###

Language servers require different patterns than batch compilation:

- **Partial pipeline processing** for different features
- **Position-aware parsing** for cursor-based functionality
- **Incremental validation** without full compilation
- **Caching and performance** optimization for real-time use

### Essential Language Server APIs ###

#### Real-time Validation ####

Use [Standard Pipeline Processing](../common-patterns.md#standard-pipeline-processing) with early termination:

```typescript
async function validateSyntax(content: string, uri: string): Promise<ValidationError[]> {
    // See [Standard Container Setup] and [Standard Project Location]
    // Use [Standard Pipeline Processing] but return errors at each stage

    const errors: ValidationError[] = [];

    // Stop at AST stage for syntax validation - don't need full semantic processing
    if (!astResult.success) {
        errors.push(convertToLanguageServerError(astResult));
    }

    return errors; // See [Common Interfaces] for ValidationError
}
```

#### Position-Based Features ####

Extract tokens at cursor positions for IntelliSense:

```typescript
async function getTokensAtPosition(content: string, line: number, char: number, uri: string): Promise<Token[]> {
    // Use [Standard Container Setup] and [Standard Pipeline Processing] to tokenizer stage

    return tokenizedResult.value.tokens.filter(token => {
        const tokenEnd = token.location.char + (token.text?.length || 0);
        return token.location.line === line &&
               token.location.char <= char &&
               char <= tokenEnd;
    });
}
```

#### Completion Provider ####

Context-aware completion using pipeline analysis:

```typescript
class DoculispCompletionProvider {
    private readonly CORE_ATOMS = [
        'section-meta', 'title', 'include', 'content', 'toc', 'get-path',
        '#', '##', '###', '####', '#####', '######'
    ];

    async getCompletions(content: string, position: Position, uri: string): Promise<CompletionItem[]> {
        // Use [Standard Pipeline Processing] to analyze context
        const context = this.analyzeContext(tokenizedResult.value.tokens, position);

        switch (context.type) {
            case 'atom': return this.CORE_ATOMS.map(atom => ({ label: atom, kind: 'Function' }));
            case 'toc-style': return this.getTocStyleCompletions();
            case 'file-path': return this.getFileCompletions(uri);
            default: return [];
        }
    }

    // See [Common Interfaces] for CompletionItem
}
```

#### Document Symbols ####

Generate document outline using full semantic analysis:

```typescript
async function getDocumentSymbols(content: string, uri: string): Promise<DocumentSymbol[]> {
    // Use full pipeline including AstDoculispParser for semantic information
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');

    const doculispResult = doculispParser.parse(astResult, variableTable);
    if (!doculispResult.success || doculispResult.value.type === 'doculisp-empty') return [];

    return extractSymbols(doculispResult.value); // See [Common Interfaces] for DocumentSymbol
}
```

### Performance Patterns ###

#### Container Lifecycle ####

For long-running language servers, cache singleton components:

```typescript
class DoculispLanguageServer {
    private sharedComponents: SharedComponents;

    async initialize() {
        const container = await containerPromise;

        // Cache singletons for performance
        this.sharedComponents = {
            documentParser: container.buildAs<DocumentParser>('documentParse'),
            tokenizer: container.buildAs<TokenFunction>('tokenizer'),
            astParser: container.buildAs<IAstParser>('astParser'),
            pathConstructor: container.buildAs<IPathConstructor>('pathConstructor')
        };
    }

    // Create fresh instances for non-singletons per request
    createDocumentContext() {
        return {
            doculispParser: this.container.buildAs<IDoculispParser>('astDoculispParse'),
            variableTable: this.container.buildAs<IVariableTable>('variableTable')
        };
    }
}
```

#### Debounced Validation ####

Implement debouncing for real-time feedback:

```typescript
class DebouncedValidator {
    private timeouts = new Map<string, NodeJS.Timeout>();
    private readonly DEBOUNCE_DELAY = 300;

    validateWithDebounce(uri: string, content: string, callback: (errors: ValidationError[]) => void) {
        const existingTimeout = this.timeouts.get(uri);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(async () => {
            const errors = await validateSyntax(content, uri); // See above
            callback(errors);
            this.timeouts.delete(uri);
        }, this.DEBOUNCE_DELAY);

        this.timeouts.set(uri, timeout);
    }
}
```

### Advanced Integration ###

#### Working Directory Management ####

Handle include resolution correctly:

```typescript
async function processWithWorkingDirectory<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const fileHandler = container.buildAs<IFileWriter>('fileHandler');
    const path = pathConstructor.buildPath(filePath);

    const originalDir = fileHandler.getProcessWorkingDirectory();
    const targetDir = path.getContainingDir();

    try {
        fileHandler.setProcessWorkingDirectory(targetDir);
        return await operation();
    } finally {
        if (originalDir.success) {
            fileHandler.setProcessWorkingDirectory(originalDir.value);
        }
    }
}
```

For complete implementation examples, see:
- **Core Pipeline APIs**: Position-aware parsing details
- **Usage Patterns**: Full class implementations
- **Common Patterns**: Reusable code blocks and interfaces

## Common Patterns ##

This section defines reusable patterns used throughout the DoculispTypeScript API to reduce duplication and improve maintainability.

### Container Setup Patterns ###

#### Standard Container Access ####

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

#### Standard Project Location ####

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

#### Standard Pipeline Processing ####

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

### Error Handling Patterns ###

#### Basic Error Handling ####

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

#### Language Server Error Conversion ####

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

### Interface Reference ###

#### Common Interfaces ####

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

## Usage Patterns and Examples ##

This section provides practical examples and common usage patterns for the DoculispTypeScript API, organized by use case and complexity level.

**Note:** All examples use standard setup patterns. See [Common Patterns](#common-patterns) for reusable code blocks including container setup, project location creation, and pipeline processing.

### Quick Start Examples ###

#### Basic Document Compilation ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPathConstructor, IPath, Result } from 'doculisp';

async function compileDocument() {
    // Use [Standard Container Setup] - see COMMON PATTERNS section
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Compile a single document with full type safety
    const sourcePath: IPath = pathConstructor.buildPath('./docs/_main.dlisp');
    const destinationPath: IPath = pathConstructor.buildPath('./README.md');

    const results: Result<string | false>[] = controller.compile(sourcePath, destinationPath);

    if (results[0].success) {
        console.log('✅ Document compiled successfully');
        console.log('📄 Output:', results[0].value);
    } else {
        console.error('❌ Compilation failed:', results[0].message);
    }
}
```

#### Project Batch Compilation ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPathConstructor, IPath, Result } from 'doculisp';

async function compileProject() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Compile entire project (multiple documents)
    const projectPath: IPath = pathConstructor.buildPath('./docs/docs.dlproj');

    // Project files don't need destination - it's embedded in structure
    const results: Result<string | false>[] = controller.compile(projectPath);

    console.log(`📁 Compiled ${results.length} documents:`);
    results.forEach((result, index) => {
        if (result.success) {
            console.log(`  ✅ Document ${index + 1}: Success`);
        } else {
            console.error(`  ❌ Document ${index + 1}: ${result.message}`);
        }
    });
}
}
```

### Language Server Examples ###

#### Real-time Validation ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IAstParser,
    IPathConstructor,
    IPath,
    IProjectLocation,
    Result,
    IFail
} from 'doculisp';

class DoculispValidator {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;
    private astParser: IAstParser;
    private pathConstructor: IPathConstructor;

    async initialize() {
        // Use [Standard Container Setup] - see common-patterns.md
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
        this.tokenizer = this.container.buildAs<TokenFunction>('tokenizer');
        this.astParser = this.container.buildAs<IAstParser>('astParser');
        this.pathConstructor = this.container.buildAs<IPathConstructor>('pathConstructor');
    }

    async validateDocument(content: string, uri: string): Promise<Diagnostic[]> {
        // Use [Standard Project Location] - see common-patterns.md
        const projectLocation: IProjectLocation = {
            documentPath: this.pathConstructor.buildPath(uri),
            documentDepth: 1,
            documentIndex: 1
        };

        const diagnostics: Diagnostic[] = [];

        // Stage 1: Document structure validation
        const documentMap = this.documentParser(content, projectLocation);
        if (!documentMap.success) {
            diagnostics.push(this.createDiagnostic(documentMap, 'error'));
            return diagnostics;
        }

        // Stage 2: Token validation
        const tokenizedResult = this.tokenizer(documentMap);
        if (!tokenizedResult.success) {
            diagnostics.push(this.createDiagnostic(tokenizedResult, 'error'));
            return diagnostics;
        }

        // Stage 3: AST syntax validation
        const astResult = this.astParser.parse(tokenizedResult);
        if (!astResult.success) {
            diagnostics.push(this.createDiagnostic(astResult, 'error'));
        }

        return diagnostics;
    }

    private createDiagnostic(result: IFail, severity: 'error' | 'warning' | 'info'): Diagnostic {
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
            severity,
            range,
            message: result.message,
            source: 'doculisp'
        };
    }
}

interface Diagnostic {
    severity: 'error' | 'warning' | 'info';
    range: { start: { line: number; character: number }, end: { line: number; character: number } };
    message: string;
    source: string;
}
```

#### Syntax Highlighting Support ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IPathConstructor,
    IPath,
    IProjectLocation,
    Token
} from 'doculisp';

class DoculispSyntaxHighlighter {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;
    private pathConstructor: IPathConstructor;

    async initialize() {
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
        this.tokenizer = this.container.buildAs<TokenFunction>('tokenizer');
        this.pathConstructor = this.container.buildAs<IPathConstructor>('pathConstructor');
    }

    async getSemanticTokens(content: string, uri: string): Promise<SemanticToken[]> {
        const projectLocation: IProjectLocation = {
            documentPath: this.pathConstructor.buildPath(uri),
            documentDepth: 1,
            documentIndex: 1
        };

        const documentMap = this.documentParser(content, projectLocation);
        if (!documentMap.success) return [];

        const tokenizedResult = this.tokenizer(documentMap);
        if (!tokenizedResult.success) return [];

        return tokenizedResult.value.tokens.map((token: Token) => ({
            line: token.location.line - 1, // Convert to 0-based
            startCharacter: token.location.char - 1,
            length: token.text?.length || 0,
            tokenType: this.mapTokenType(token.type),
            tokenModifiers: []
        }));
    }

    private mapTokenType(tokenType: string): number {
        // Map to Language Server Protocol semantic token types
        switch (tokenType) {
            case 'token - atom': return 0; // keyword
            case 'token - parameter': return 1; // string
            case 'token - text': return 2; // comment
            case 'token - close parenthesis': return 3; // operator
            default: return 4; // other
        }
    }
}

interface SemanticToken {
    line: number;
    startCharacter: number;
    length: number;
    tokenType: number;
    tokenModifiers: number[];
}
```

#### IntelliSense Provider ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IPathConstructor,
    IPath,
    IProjectLocation,
    Token
} from 'doculisp';

class DoculispCompletionProvider {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;
    private pathConstructor: IPathConstructor;

    private readonly CORE_ATOMS = [
        'section-meta', 'title', 'subtitle', 'author', 'id', 'ref-link', 'include',
        'content', 'toc', 'label', 'style', 'get-path',
        '#', '##', '###', '####', '#####', '######'
    ];

    private readonly TOC_STYLES = [
        'no-table', 'unlabeled', 'labeled', 'numbered',
        'numbered-labeled', 'bulleted', 'bulleted-labeled'
    ];

    async initialize() {
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
        this.tokenizer = this.container.buildAs<TokenFunction>('tokenizer');
        this.pathConstructor = this.container.buildAs<IPathConstructor>('pathConstructor');
    }

    async getCompletionItems(
        content: string,
        position: { line: number; character: number },
        uri: string
    ): Promise<CompletionItem[]> {
        const projectLocation: IProjectLocation = {
            documentPath: this.pathConstructor.buildPath(uri),
            documentDepth: 1,
            documentIndex: 1
        };

        const documentMap = this.documentParser(content, projectLocation);
        if (!documentMap.success) return [];

        const tokenizedResult = this.tokenizer(documentMap);
        if (!tokenizedResult.success) return [];

        const context = this.analyzeCompletionContext(tokenizedResult.value.tokens, position);

        switch (context.type) {
            case 'atom':
                return this.CORE_ATOMS.map(atom => ({
                    label: atom,
                    kind: 'Function',
                    documentation: this.getAtomDocumentation(atom),
                    insertText: atom
                }));

            case 'toc-style':
                return this.TOC_STYLES.map(style => ({
                    label: style,
                    kind: 'Value',
                    documentation: this.getTocStyleDocumentation(style),
                    insertText: style
                }));

            case 'file-path':
                return this.getFilePathCompletions(uri);

            default:
                return [];
        }
    }

    private analyzeCompletionContext(
        tokens: Token[],
        position: { line: number; character: number }
    ): CompletionContext {
        const line = position.line + 1; // Convert to 1-based
        const char = position.character + 1;

        const tokensAtPosition = tokens.filter(token =>
            token.location.line === line &&
            token.location.char <= char &&
            char <= token.location.char + (token.text?.length || 0)
        );

        if (tokensAtPosition.length === 0) {
            return { type: 'atom' };
        }

        // Analyze surrounding context
        const tokenIndex = tokens.findIndex(t => tokensAtPosition.includes(t));
        const previousTokens = tokens.slice(Math.max(0, tokenIndex - 3), tokenIndex);

        if (previousTokens.some(t => t.type === 'token - atom' && t.text === 'style')) {
            return { type: 'toc-style' };
        }

        if (previousTokens.some(t => t.type === 'token - atom' && t.text?.match(/^[A-Z]/))) {
            return { type: 'file-path' };
        }

        return { type: 'atom' };
    }

    private getAtomDocumentation(atom: string): string {
        const docs = {
            'section-meta': 'Define document metadata including title, author, and includes',
            'title': 'Set the document title',
            'include': 'Include external Doculisp files',
            'toc': 'Generate table of contents',
            '#': 'Create a dynamic header at the current nesting level',
            'get-path': 'Create cross-reference to another document section'
        };
        return docs[atom] || `Doculisp atom: ${atom}`;
    }

    private getTocStyleDocumentation(style: string): string {
        const docs = {
            'numbered-labeled': 'Numbered list with section labels',
            'bulleted-labeled': 'Bulleted list with section labels',
            'labeled': 'Section labels only',
            'numbered': 'Numbers only',
            'no-table': 'No table of contents'
        };
        return docs[style] || `TOC style: ${style}`;
    }

    private getFilePathCompletions(currentUri: string): CompletionItem[] {
        // Implementation would scan filesystem for .md and .dlisp files
        return [
            { label: './readme.md', kind: 'File', insertText: './readme.md' },
            { label: './getting-started.md', kind: 'File', insertText: './getting-started.md' }
        ];
    }
}

interface CompletionItem {
    label: string;
    kind: string;
    documentation?: string;
    insertText: string;
}

interface CompletionContext {
    type: 'atom' | 'toc-style' | 'file-path';
}
```

#### Document Symbol Provider ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IAstParser,
    IDoculispParser,
    IPathConstructor,
    IVariableTable,
    IPath,
    IProjectLocation,
    IDoculisp,
    ITitle,
    IHeader,
    ILocation
} from 'doculisp';

class DoculispSymbolProvider {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;
    private astParser: IAstParser;
    private pathConstructor: IPathConstructor;

    async initialize() {
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
        this.tokenizer = this.container.buildAs<TokenFunction>('tokenizer');
        this.astParser = this.container.buildAs<IAstParser>('astParser');
        this.pathConstructor = this.container.buildAs<IPathConstructor>('pathConstructor');
    }

    async getDocumentSymbols(content: string, uri: string): Promise<DocumentSymbol[]> {
        const doculispParser = this.container.buildAs<IDoculispParser>('astDoculispParse');
        const variableTable = this.container.buildAs<IVariableTable>('variableTable');

        const projectLocation: IProjectLocation = {
            documentPath: this.pathConstructor.buildPath(uri),
            documentDepth: 1,
            documentIndex: 1
        };

        // Full parsing pipeline for semantic analysis
        const documentMap = this.documentParser(content, projectLocation);
        if (!documentMap.success) return [];

        const tokenizedResult = this.tokenizer(documentMap);
        if (!tokenizedResult.success) return [];

        const astResult = this.astParser.parse(tokenizedResult);
        if (!astResult.success) return [];

        const doculispResult = doculispParser.parse(astResult, variableTable);
        if (!doculispResult.success || doculispResult.value.type === 'doculisp-empty') return [];

        return this.generateDocumentSymbols(doculispResult.value);
    }

    private generateDocumentSymbols(doculisp: IDoculisp): DocumentSymbol[] {
        const symbols: DocumentSymbol[] = [];

        // Add title as root symbol
        const titles = doculisp.section.doculisp.filter(p => p.type === 'doculisp-title') as ITitle[];
        if (titles.length > 0) {
            const title = titles[0];
            symbols.push({
                name: title.title,
                kind: 'Class',
                range: this.locationToRange(title.documentOrder),
                selectionRange: this.locationToRange(title.documentOrder),
                children: []
            });
        }

        // Add headers as symbols
        const headers = doculisp.section.doculisp.filter(p => p.type === 'doculisp-header') as IHeader[];
        headers.forEach(header => {
            symbols.push({
                name: header.text,
                kind: 'Method',
                range: this.locationToRange(header.documentOrder),
                selectionRange: this.locationToRange(header.documentOrder),
                children: []
            });
        });

        // Add includes as symbols
        doculisp.section.include.forEach(include => {
            symbols.push({
                name: include.sectionLabel,
                kind: 'Module',
                range: this.locationToRange(include.documentOrder),
                selectionRange: this.locationToRange(include.documentOrder),
                children: []
            });
        });

        return symbols;
    }

    private locationToRange(location: ILocation): Range {
        const line = location.line - 1; // Convert to 0-based
        const char = location.char - 1;
        return {
            start: { line, character: char },
            end: { line, character: char + 1 }
        };
    }
}

interface DocumentSymbol {
    name: string;
    kind: string;
    range: Range;
    selectionRange: Range;
    children: DocumentSymbol[];
}

interface Range {
    start: { line: number; character: number };
    end: { line: number; character: number };
}
```

### Pipeline Processing Examples ###

#### Step-by-Step Pipeline Processing ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import {
    DocumentParser,
    TokenFunction,
    IAstParser,
    IPathConstructor,
    IProjectLocation,
    IAst
} from 'doculisp';

async function processDocumentPipeline(filePath: string, content: string): Promise<IAst | undefined> {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const astParser = container.buildAs<IAstParser>('astParser');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectLocation: IProjectLocation = {
        documentPath: pathConstructor.buildPath(filePath),
        documentDepth: 1,
        documentIndex: 1
    };

    // Stage 1: Document Parsing
    console.log('🔍 Stage 1: Document Parsing');
    const documentMap = documentParser(content, projectLocation);
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return;
    }
    console.log(`  📄 Parsed ${documentMap.value.parts.length} document parts`);

    // Stage 2: Tokenization
    console.log('🔧 Stage 2: Tokenization');
    const tokenizedResult = tokenizer(documentMap);
    if (!tokenizedResult.success) {
        console.error('Tokenization failed:', tokenizedResult.message);
        return;
    }
    console.log(`  🎯 Generated ${tokenizedResult.value.tokens.length} tokens`);

    // Stage 3: AST Generation
    console.log('🌳 Stage 3: AST Generation');
    const astResult = astParser.parse(tokenizedResult);
    if (!astResult.success) {
        console.error('AST parsing failed:', astResult.message);
        return;
    }

    if (astResult.value.type === 'ast-root') {
        console.log(`  📊 Generated AST with ${astResult.value.parts.length} parts`);
    } else {
        console.log('  📭 Empty AST generated');
    }

    return astResult.value;
}
```

#### Content Analysis ####

```typescript
async function analyzeDoculispContent(files: string[]) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const analysis = {
        totalFiles: files.length,
        filesByType: { md: 0, dlisp: 0, dlproj: 0 },
        totalDoculispBlocks: 0,
        mostCommonAtoms: {},
        averageTokensPerFile: 0
    };

    for (const [index, filePath] of files.entries()) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const documentPath = pathConstructor.buildPath(filePath);

            // Track file types
            const extension = documentPath.extension.slice(1);
            if (extension in analysis.filesByType) {
                analysis.filesByType[extension]++;
            }

            const projectLocation = {
                documentPath,
                documentDepth: 1,
                documentIndex: index + 1
            };

            // Process through pipeline
            const documentMap = documentParser(content, projectLocation);
            if (!documentMap.success) continue;

            const tokenizedResult = tokenizer(documentMap);
            if (!tokenizedResult.success) continue;

            // Analyze tokens
            const tokens = tokenizedResult.value.tokens;
            const doculispTokens = tokens.filter(t => t.type !== 'token - text');
            analysis.totalDoculispBlocks += doculispTokens.length;

            // Track atom frequency
            tokens
                .filter(t => t.type === 'token - atom')
                .forEach(t => {
                    analysis.mostCommonAtoms[t.text] =
                        (analysis.mostCommonAtoms[t.text] || 0) + 1;
                });

        } catch (error) {
            console.error(`Failed to process ${filePath}:`, error.message);
        }
    }

    // Calculate averages
    analysis.averageTokensPerFile = analysis.totalDoculispBlocks / analysis.totalFiles;

    return analysis;
}
```

### Advanced Usage Patterns ###

#### Custom Container Integration ####

```typescript
async function customServiceIntegration() {
    const container = await containerPromise;

    // Register custom services
    const customLogger = {
        name: 'customLogger',
        log: (level: string, message: string) => {
            console.log(`[${level.toUpperCase()}] ${new Date().toISOString()}: ${message}`);
        }
    };

    container.registerValue(customLogger);

    // Register custom builder with dependencies
    container.registerBuilder(
        (logger: any, fileHandler: IFileWriter) => ({
            name: 'auditService',
            logFileOperation: (operation: string, path: string) => {
                logger.log('info', `File ${operation}: ${path}`);
            }
        }),
        ['customLogger', 'fileHandler'],
        'auditService',
        true // singleton
    );

    // Use custom service
    const auditService = container.build('auditService');
    auditService.logFileOperation('compile', './README.md');
}
```

#### Error Handling Patterns ####

```typescript
async function robustCompilation(sourcePath: string, destinationPath?: string) {
    try {
        const container = await containerPromise;
        const controller = container.buildAs<IController>('controller');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

        const source = pathConstructor.buildPath(sourcePath);
        const destination = destinationPath ?
            pathConstructor.buildPath(destinationPath) : undefined;

        // Validate inputs
        if (source.extension === '.dlproj' && destination) {
            console.warn('Project files ignore destination path');
        }

        if (source.extension !== '.dlproj' && !destination) {
            throw new Error('Destination path required for non-project files');
        }

        // Compile with comprehensive error handling
        const results = controller.compile(source, destination);

        for (const [index, result] of results.entries()) {
            if (result.success) {
                console.log(`✅ Document ${index + 1}: Compiled successfully`);
            } else {
                // Analyze error type
                if (result.message.includes('Circular dependencies')) {
                    console.error(`🔄 Circular dependency in document ${index + 1}`);
                } else if (result.message.includes('parenthesis')) {
                    console.error(`🔧 Syntax error in document ${index + 1}: Check parentheses`);
                } else if (result.message.includes('file')) {
                    console.error(`📁 File error in document ${index + 1}: Check paths`);
                } else {
                    console.error(`❌ Document ${index + 1}: ${result.message}`);
                }
            }
        }

        return results;

    } catch (error) {
        console.error('💥 Unexpected compilation error:', error.message);
        return [];
    }
}
```

#### Testing Patterns ####

```typescript
import { jest } from '@jest/globals';

async function setupTestEnvironment() {
    const container = await containerPromise;

    // For testing, use the testable container features
    const testContainer = container as ITestableContainer;

    // Create mock file handler
    const mockFileHandler = {
        name: 'fileHandler',
        load: jest.fn(),
        write: jest.fn(),
        exists: jest.fn(),
        getProcessWorkingDirectory: jest.fn(),
        setProcessWorkingDirectory: jest.fn()
    };

    // Replace for testing
    if (testContainer.supportsReplace()) {
        testContainer.replaceValue(mockFileHandler, 'fileHandler');
    }

    return { container: testContainer, mockFileHandler };
}

async function testDocumentCompilation() {
    const { container, mockFileHandler } = await setupTestEnvironment();

    // Setup mocks
    mockFileHandler.load.mockReturnValue({
        success: true,
        value: '(section-meta Test Document)'
    });
    mockFileHandler.write.mockReturnValue({ success: true, value: undefined });
    mockFileHandler.exists.mockReturnValue({ success: true, value: true });

    // Test compilation
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const sourcePath = pathConstructor.buildPath('./test.dlisp');
    const destinationPath = pathConstructor.buildPath('./test.md');

    const results = controller.compile(sourcePath, destinationPath);

    expect(results[0].success).toBe(true);
    expect(mockFileHandler.load).toHaveBeenCalledWith(sourcePath);
    expect(mockFileHandler.write).toHaveBeenCalled();
}
```

### Performance Optimization ###

#### Batch Processing Optimization ####

```typescript
async function optimizedBatchProcessing(files: string[]) {
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Group files by type for optimized processing
    const filesByType = files.reduce((acc, file) => {
        const extension = path.extname(file);
        (acc[extension] = acc[extension] || []).push(file);
        return acc;
    }, {} as Record<string, string[]>);

    const results = [];

    // Process project files first (most efficient for multiple docs)
    if (filesByType['.dlproj']) {
        for (const projectFile of filesByType['.dlproj']) {
            const projectPath = pathConstructor.buildPath(projectFile);
            const projectResults = controller.compile(projectPath);
            results.push(...projectResults);
        }
    }

    // Process .dlisp files (fastest individual processing)
    if (filesByType['.dlisp']) {
        for (const dlispFile of filesByType['.dlisp']) {
            const sourcePath = pathConstructor.buildPath(dlispFile);
            const destPath = pathConstructor.buildPath(dlispFile.replace('.dlisp', '.md'));
            const result = controller.compile(sourcePath, destPath);
            results.push(...result);
        }
    }

    // Process .md files last (highest overhead)
    if (filesByType['.md']) {
        for (const mdFile of filesByType['.md']) {
            const sourcePath = pathConstructor.buildPath(mdFile);
            const destPath = pathConstructor.buildPath(mdFile.replace(/\.md$/, '_compiled.md'));
            const result = controller.compile(sourcePath, destPath);
            results.push(...result);
        }
    }

    return results;
}
```

#### Container Optimization ####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPathConstructor, IPath, Result } from 'doculisp';

class DoculispProcessor {
    private container: any;
    private controller: IController;
    private pathConstructor: IPathConstructor;

    async initialize() {
        // Initialize once and reuse
        this.container = await containerPromise;
        this.controller = this.container.buildAs<IController>('controller');
        this.pathConstructor = this.container.buildAs<IPathConstructor>('pathConstructor');
    }

    async compileFile(sourcePath: string, destinationPath?: string): Promise<Result<string | false>[]> {
        // Reuse container instances for better performance
        const source: IPath = this.pathConstructor.buildPath(sourcePath);
        const destination: IPath | undefined = destinationPath ?
            this.pathConstructor.buildPath(destinationPath) : undefined;

        return this.controller.compile(source, destination);
    }

    async compileMultiple(files: Array<{source: string, destination?: string}>): Promise<Result<string | false>[]> {
        const results: Result<string | false>[] = [];
        for (const file of files) {
            const result = await this.compileFile(file.source, file.destination);
            results.push(...result);
        }
        return results;
    }
}

// Usage
const processor = new DoculispProcessor();
await processor.initialize();

// Efficient repeated processing
const files = [
    { source: './doc1.dlisp', destination: './doc1.md' },
    { source: './doc2.dlisp', destination: './doc2.md' }
];

const results = await processor.compileMultiple(files);
```

## Testing Patterns ##

### Creating Testable Containers ###

The container system provides excellent support for testing through dependency replacement:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

describe('My Service Tests', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Create a testable container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
    });

    afterEach(() => {
        // Clean up replacements
        testContainer.restoreAll();
    });

    it('should handle file operations', () => {
        // Mock the file handler
        const mockFileHandler = {
            read: jest.fn().mockReturnValue({ success: true, value: 'test content' }),
            write: jest.fn().mockReturnValue({ success: true, value: true }),
            exists: jest.fn().mockReturnValue({ success: true, value: true })
        };

        // Replace the file handler in the container
        testContainer.replaceValue(mockFileHandler, 'fileHandler');

        // Build your service that depends on fileHandler
        const myService = testContainer.buildAs<IMyService>('myService');

        // Test the service
        const result = myService.doSomething();

        expect(mockFileHandler.read).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });
});
```

### Mocking Dependencies ###

#### Simple Value Replacement ####

```typescript
// Replace with a simple mock object
const mockUtil = {
    ok: (value: any) => ({ success: true, value }),
    fail: (message: string) => ({ success: false, message })
};

testContainer.replaceValue(mockUtil, 'util');
```

#### Builder Function Replacement ####

```typescript
// Replace with a builder function
testContainer.replaceBuilder(
    (dependency: IDependency) => new MockService(dependency),
    ['mockDependency'],
    'originalService'
);
```

### Testing Parser Pipeline ###

Testing the complete parsing pipeline:

```typescript
describe('Parser Pipeline', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();

        // Mock file operations for consistent testing
        const mockFileHandler = {
            read: jest.fn(),
            write: jest.fn(),
            exists: jest.fn()
        };

        testContainer.replaceValue(mockFileHandler, 'fileHandler');
    });

    it('should parse doculisp correctly', () => {
        const tokenizer = testContainer.buildAs<ITokenizer>('tokenizer');
        const astParser = testContainer.buildAs<IAstParser>('astParser');
        const doculispParser = testContainer.buildAs<IAstDoculispParser>('astDoculispParse');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');

        const input = '(#intro Introduction)\n\nContent here.';
        const path = pathConstructor.buildPath('./test.dlisp');

        // Test each stage
        const tokens = tokenizer.tokenize(input, path);
        expect(tokens.success).toBe(true);

        const ast = astParser.parse(tokens.value, path);
        expect(ast.success).toBe(true);

        const doculisp = doculispParser.parse(ast.value, path);
        expect(doculisp.success).toBe(true);
        expect(doculisp.value).toHaveLength(2); // Header + content
    });
});
```

### Variable Table Testing ###

Testing variable management (limited to system variables and IDs):

```typescript
describe('Variable Table', () => {
    let testContainer: ITestableContainer;
    let variableTable: IVariableTable;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
        variableTable = testContainer.buildAs<IVariableTable>('variableTable');
    });

    it('should provide access to system variables', () => {
        // Note: Variable table primarily used for system variables like 'source', 'destination'
        // and ID tracking. Custom string variables are not supported.

        // Test checking for system variables
        const hasSource = variableTable.hasKey('source');
        const hasDestination = variableTable.hasKey('destination');

        // System variables may or may not be present depending on compilation context
        expect(typeof hasSource).toBe('boolean');
        expect(typeof hasDestination).toBe('boolean');
    });

    it('should handle ID variable queries', () => {
        // The variable table is primarily used for ID tracking during compilation
        const hasTestId = variableTable.hasKey('some-header-id');
        expect(typeof hasTestId).toBe('boolean');
    });
});
```

### Error Scenario Testing ###

Testing error conditions and edge cases:

```typescript
describe('Error Handling', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
    });

    it('should handle missing files gracefully', () => {
        // Mock file handler to simulate missing file
        const mockFileHandler = {
            exists: jest.fn().mockReturnValue({ success: true, value: false }),
            read: jest.fn().mockReturnValue({
                success: false,
                message: 'File not found'
            })
        };

        testContainer.replaceValue(mockFileHandler, 'fileHandler');

        const controller = testContainer.buildAs<IController>('controller');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');

        const sourcePath = pathConstructor.buildPath('./nonexistent.dlisp');
        const result = controller.compile(sourcePath);

        expect(result.success).toBe(false);
        expect(result.message).toContain('File not found');
    });

    it('should handle circular dependencies', () => {
        // This test would involve creating modules with circular deps
        // and verifying the container throws appropriate errors
        expect(() => {
            testContainer.registerBuilder(
                (dep: any) => dep,
                ['circularDep'],
                'circularDep'
            );
            testContainer.build('circularDep');
        }).toThrow(/Circular dependencies/);
    });
});
```

### Integration Testing ###

Testing complete workflows:

```typescript
describe('Integration Tests', () => {
    it('should compile a complete document', async () => {
        // Use the real container for integration tests (container is async)
        const container = await containerPromise;
        const controller = container.buildAs<IController>('controller');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

        // Test with a known good file
        const sourcePath = pathConstructor.buildPath('./test-fixtures/sample.dlisp');
        const outputPath = pathConstructor.buildPath('./test-output/result.md');

        const result = controller.compile(sourcePath, outputPath);

        expect(result.success).toBe(true);

        // Verify output file was created and has expected content
        const fileHandler = container.buildAs<IFileWriter>('fileHandler');
        const outputExists = fileHandler.exists(outputPath);
        expect(outputExists.success).toBe(true);
        expect(outputExists.value).toBe(true);
    });
});
```

## Advanced Usage ##

### Custom Module Registration ###

You can extend the container by registering your own modules:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Define your custom service
interface ICustomProcessor {
    process(input: string): Result<string>;
}

class CustomProcessor implements ICustomProcessor {
    constructor(
        private textHelpers: ITextHelpers,
        private util: IUtil
    ) {}

    process(input: string): Result<string> {
        try {
            const processed = this.textHelpers.format(input);
            return this.util.ok(processed);
        } catch (error) {
            return this.util.fail(`Processing failed: ${error.message}`);
        }
    }
}

// Register the custom service (container is async)
const container = await containerPromise;
container.registerBuilder(
    (textHelpers: ITextHelpers, util: IUtil) => new CustomProcessor(textHelpers, util),
    ['textHelpers', 'util'],
    'customProcessor',
    true // singleton
);

// Use the custom service
const processor = container.buildAs<ICustomProcessor>('customProcessor');
```

### Container Lifecycle Management ###

#### Manual Module Loading ####

For advanced scenarios, you can manually control module loading:

```typescript
// Note: Creating custom containers requires direct access to internal classes
// This is an advanced use case - most users should use the default container
const { Container } = require('doculisp/dist/container');

// Create a new container instance
const customContainer = new Container();

// Register specific modules only
customContainer.registerValue(console, 'logger');
customContainer.registerBuilder(
    (logger: Console) => ({
        log: (msg: string) => logger.log(`[CUSTOM] ${msg}`)
    }),
    ['logger'],
    'customLogger'
);

const logger = customContainer.buildAs<{ log: (msg: string) => void }>('customLogger');
logger.log('Hello from custom container!');
```

### Performance Considerations ###

#### Singleton Strategy ####

Most objects should be singletons for performance:

```typescript
// Good: Singleton registration (container is async)
const container = await containerPromise;
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    true // singleton = true
);

// Avoid: Non-singleton for expensive objects
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    false // Creates new instance every time
);
```

#### Lazy Loading ####

The container supports lazy loading - objects are only created when first requested:

```typescript
// This registration doesn't create the object yet (container is async)
const container = await containerPromise;
container.registerBuilder(
    () => new HeavyObject(),
    [],
    'heavyObject',
    true
);

// Object is created here on first build()
const heavy = container.buildAs<HeavyObject>('heavyObject');

// Subsequent calls return the same instance
const same = container.buildAs<HeavyObject>('heavyObject');
console.log(heavy === same); // true
```

### Error Recovery and Fallbacks ###

#### Graceful Degradation ####

```typescript
interface IOptionalService {
    isAvailable(): boolean;
    doWork(): Result<string>;
}

class OptionalServiceImpl implements IOptionalService {
    private available: boolean;

    constructor(dependency?: IDependency) {
        this.available = !!dependency;
    }

    isAvailable(): boolean {
        return this.available;
    }

    doWork(): Result<string> {
        if (!this.available) {
            return { success: false, message: 'Service not available' };
        }
        // Do actual work
        return { success: true, value: 'Work completed' };
    }
}

// Register with optional dependency (container is async)
const container = await containerPromise;
container.registerBuilder(
    (optionalDep?: IDependency) => new OptionalServiceImpl(optionalDep),
    [], // No required dependencies
    'optionalService'
);
```

### Container Inspection ###

#### Debugging and Monitoring ####

```typescript
// Get list of all registered modules (container is async)
const container = await containerPromise;
const modules = container.getModuleList();
console.log('Registered modules:', modules);

// Check container state
console.log('Container ID:', container.id);
console.log('Is testable:', container.isTestable);

// Custom monitoring wrapper
async function withLogging<T>(moduleName: string): Promise<T> {
    console.log(`Building module: ${moduleName}`);
    const start = Date.now();

    const container = await containerPromise;
    const result = container.buildAs<T>(moduleName);

    const duration = Date.now() - start;
    console.log(`Built ${moduleName} in ${duration}ms`);

    return result;
}

// Usage (async because container is Promise-based)
const tokenizer = await withLogging<ITokenizer>('tokenizer');
```

### Package Integration ###

#### External Package Registration ####

For integrating external packages:

```typescript
// Register Node.js built-in modules (container is async)
const container = await containerPromise;
container.registerValue(require('fs'), 'fs');
container.registerValue(require('path'), 'path');

// Register npm packages
container.registerValue(require('lodash'), 'lodash');

// Create wrapper services
container.registerBuilder(
    (fs: any, path: any) => ({
        readFileSync: (filePath: string) => fs.readFileSync(filePath, 'utf8'),
        joinPath: (...segments: string[]) => path.join(...segments)
    }),
    ['fs', 'path'],
    'nodeUtils'
);
```

### Memory Management ###

#### Container Cleanup ####

For long-running applications:

```typescript
// In test environments, clean up containers
afterEach(() => {
    if (testContainer.supportsReplace()) {
        testContainer.restoreAll();
    }
});

// For memory-sensitive applications, you might need custom cleanup
class ManagedService {
    dispose() {
        // Clean up resources
    }
}

// Implement cleanup patterns
const managedServices: ManagedService[] = [];

// Container needs to be async
containerPromise.then(container => {
    container.registerBuilder(
        () => {
            const service = new ManagedService();
            managedServices.push(service);
            return service;
        },
        [],
        'managedService'
    );
});

// Application shutdown
process.on('exit', () => {
    managedServices.forEach(service => service.dispose());
});
```

### Advanced Testing Scenarios ###

#### Partial Mock Replacement ####

```typescript
// Replace only specific methods of a service (container is async)
const container = await containerPromise;
const realFileHandler = container.buildAs<IFileWriter>('fileHandler');

const partialMock = {
    ...realFileHandler,
    read: jest.fn().mockReturnValue({ success: true, value: 'mocked content' })
};

testContainer.replaceValue(partialMock, 'fileHandler');
```

#### State Verification ####

```typescript
// Create stateful service for testing
class StatefulService {
    private state: string[] = [];

    addState(value: string) {
        this.state.push(value);
    }

    getState(): string[] {
        return [...this.state];
    }
}

testContainer.registerValue(new StatefulService(), 'statefulService');

// Test state changes
const service = testContainer.buildAs<StatefulService>('statefulService');
service.addState('test');

expect(service.getState()).toContain('test');
```

<!-- Written By: Jason Kerney -->
<!-- Written By: GitHub Copilot -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->