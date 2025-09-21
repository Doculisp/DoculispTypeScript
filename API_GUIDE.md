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
* [Container Basics](#container-basics)
* [Core Objects Reference](#core-objects-reference)
* [Parsing Pipeline Chains](#parsing-pipeline-chains)
* [Detailed Compilation Instructions](#detailed-compilation-instructions)
* [Usage Examples](#usage-examples)
* [Testing Patterns](#testing-patterns)
* [Advanced Usage](#advanced-usage)

## Introduction ##

The DoculispTypeScript project uses a custom **Dependency Injection (DI) Container** to manage object creation, dependencies, and lifecycle. This guide provides comprehensive information about how to work with the container system and understand the core objects available in the compilation pipeline.

### Why Dependency Injection? ###

The DI container provides several key benefits:

- **Testability**: Easy mocking and replacement of dependencies during testing
- **Modularity**: Clean separation of concerns and loose coupling
- **Lifecycle Management**: Automatic singleton management and dependency resolution
- **Circular Dependency Detection**: Built-in protection against dependency cycles

### Container Architecture ###

The container system consists of several interfaces:

- `IContainer`: Main interface combining dependency management and registration
- `IDependencyManager`: Building and retrieving objects
- `IDependencyContainer`: Registering new modules
- `ITestableContainer`: Testing-specific features like dependency replacement

### Getting Started ###

The container is automatically populated with all available modules when the application starts. You can access it through:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Build any registered object (container is async)
const container = await containerPromise;
const parser = container.buildAs<ITokenizer>('tokenizer');
```

**Important**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing the container.

The container automatically resolves all dependencies and ensures proper initialization order.

### TypeScript Types ###

When using TypeScript, you can import types from the package:

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

### Important Note About Variables ###

The Doculisp compiler has very limited variable support. The variable table only supports:

- **System-generated string variables**: `source` and `destination` (automatically set during compilation)
- **ID variables**: Used internally for tracking header IDs and ensuring uniqueness

**Custom string variables are NOT supported** - you cannot add arbitrary string variables for use in documents.

## Container Basics ##

### Building Objects ###

The primary way to get objects from the container is using the `build` methods:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Build with automatic type inference (container is async)
const container = await containerPromise;
const tokenizer = container.build('tokenizer');

// Build with explicit typing (recommended)
const parser = container.buildAs<IAstParser>('astParser');
```

### Registration Patterns ###

Objects are registered automatically by the module loader, but you can also register manually:

#### Registering Values ####

```typescript
// Get the container first (container is async)
const container = await containerPromise;

// Register a simple value
container.registerValue(myConfig, 'config');

// Register an object with a name property
const logger = { name: 'logger', log: (msg: string) => console.log(msg) };
container.registerValue(logger);
```

#### Registering Builders ####

```typescript
// Get the container first (container is async)
const container = await containerPromise;

// Register a builder function
container.registerBuilder(
    (dep1: IDep1, dep2: IDep2) => new MyService(dep1, dep2),
    ['dependency1', 'dependency2'],
    'myService',
    true // singleton
);
```

#### Registration Interface ####

All registered modules implement the `IRegisterable` interface:

```typescript
interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}
```

### Error Handling ###

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

### Circular Dependencies ###

The container automatically detects circular dependencies and throws descriptive errors:

```
Error: Circular dependencies between ("moduleA" => "moduleB" => "moduleA")
```

## Core Objects Reference ##

### Parser Pipeline Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `tokenizer` | `ITokenizer` | Converts raw text into tokens (atoms, parentheses, parameters) |
| `astParser` | `IAstParser` | Builds Abstract Syntax Tree from tokens |
| `astDoculispParse` | `IAstDoculispParser` | Converts AST to Doculisp semantic structures |
| `astProjectParse` | `IAstProjectParser` | Parses `.dlproj` project files |
| `documentParse` | `IDocumentParser` | Extracts Doculisp blocks from markdown documents |

### Output Generation Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `stringWriter` | `IStringWriter` | Generates final markdown output from parsed structures |
| `stringBuilder` | `IStringBuilder` | Utility for building strings with proper formatting |

### File and Path Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `fileHandler` | `IFileWriter` | File system operations (read, write, exists) |
| `pathConstructor` | `IPathConstructor` | Creates and manipulates `IPath` objects |

### Data Management Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `variableTable` | `IVariableTable` | Manages system variables (`source`, `destination`) and ID tracking |
| `includeBuilder` | `IIncludeBuilder` | Processes include statements and builds document trees |
| `structure` | `IStructure` | Analyzes document structure and relationships |

### Control and Orchestration Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `controller` | `IController` | Main compilation controller with compile/test methods |
| `internals` | `IInternals` | Internal processing utilities and helpers |

### Utility Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `util` | `IUtil` | General utilities including Result<T> helpers |
| `utilBuilder` | `IUtilBuilder` | Utility builders and factory methods |
| `textHelpers` | `ITextHelpers` | Text processing and formatting utilities |
| `trimArray` | `ITrimArray` | Array manipulation utilities |
| `searches` | `ISearches` | Search and lookup utilities |
| `version` | `IVersion` | Version information and management |

### Object Lifecycle ###

Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls

### Key Interface Examples ###

#### ITokenizer ####

```typescript
interface ITokenizer {
    tokenize(input: string, path: IPath): Result<Token[]>;
}
```

#### IVariableTable ####

```typescript
interface IVariableTable {
    getValue<T extends IVariable>(key: string): Result<T>;
    hasKey(key: string): boolean;
    // Note: Limited functionality - primarily for system variables and ID tracking
    // Only supports system-generated string variables: 'source' and 'destination'
    // Custom string variables are NOT supported
}
```

#### IController ####

```typescript
interface IController {
    compile(sourcePath: IPath, outputPath?: IPath): Result<string>;
    test(sourcePaths: IPath[]): Result<string>[];
}
```

## Parsing Pipeline Chains ##

Understanding how Doculisp processes different file types is crucial for working with the container system effectively. This section provides comprehensive documentation of the three distinct parsing pipelines and their object chains.

### Overview of File Types ###

Doculisp supports three primary file types, each with its own specialized parsing pipeline:

1. **`.dlproj` Project Files** - Define multi-document projects with source/output mappings
2. **`.dlisp` Pure Doculisp Files** - Contain only Doculisp structure and metadata
3. **`.md` Markdown Files** - Standard markdown with embedded Doculisp blocks in HTML comments

Each file type follows a different object chain through the container system, optimized for its specific purpose and content structure.

### Core Parsing Components ###

Before examining the specific pipelines, it's important to understand the common processing components that all file types share. These form the foundation of Doculisp's parsing architecture.

#### Universal Parsing Steps ####

All pipelines follow this core sequence for initial file processing:

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

#### File Extension Detection and Routing ####

The controller uses file extensions to automatically select the appropriate processing pipeline:

```typescript
// Primary routing logic in Controller.compile()
if (sourcePath.extension === '.dlproj') {
    return _compileProject(sourcePath);  // Project pipeline
}

// Standard document routing in Controller._compile()
variableTable.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
if (destinationPath) {
    variableTable.addValue(destKey, { type: 'variable-path', value: destinationPath });
}
return [_compile(variableTable)];

// Parser selection in DocumentParse
const isDoculispFile = documentPath.extension === '.dlisp' ||
                      documentPath.extension === '.dlproj';

if (isDoculispFile) {
    // Use pure Doculisp parser (no HTML comment extraction)
    parser = createStringParser(isDoculisp(true));
} else {
    // Use markdown parser (extract Doculisp from HTML comments)
    parser = createStringParser(isMultiline(), isInline(), isComment(), isWord());
}
```

#### Working Directory Management ####

All pipelines implement consistent working directory management for relative path resolution:

**Common Pattern:**
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

#### Variable Table Setup and Lifecycle ####

Variable tables follow consistent patterns across all pipelines:

**Core Variables:**
- `' source'` (note leading space): Source file path
- `' destination'` (note leading space): Output file path
- Document IDs: For cross-reference resolution
- `author`: Author information for attribution

**Table Hierarchy:**
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

#### Include Processing Pattern ####

Include processing follows the same recursive pattern across `.dlisp` and `.md` files:

**Common Include Logic:**
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

#### Error Handling Patterns ####

All pipelines use consistent error handling with the `Result<T>` pattern:

**Standard Error Flow:**
```typescript
// Early return on any failure
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

### Project File Pipeline for dlproj Files ###

Project files define collections of documents and are processed through a specialized pipeline that handles project-level orchestration. Unlike individual document files, project files manage multiple source/output mappings and coordinate batch processing.

#### Object Chain for dlproj Files ####

The project pipeline extends the core parsing components with project-specific processing:

```
Controller (IController)
    ↓ detects .dlproj extension
IncludeBuilder.parseProject()
    ↓ [CORE: FileHandler → DocumentParse → Tokenizer → AstParser]
AstProjectParse (IProjectParser)
    ↓ parses project structure into document definitions
[Project-Specific: Multi-document coordination]
    ↓ for each document in project
IncludeBuilder.parse()
    ↓ [CORE: Standard .dlisp or .md pipeline]
StringWriter.writeAst()
    ↓ [CORE: Output generation for each document]
```

#### Project-Specific Processing ####

**Unique Characteristics:**
- **No destination path**: Project files embed output paths in their structure
- **Multi-document orchestration**: Processes multiple source files in single operation
- **Batch variable table management**: Creates child tables for each document
- **Specialized parsing**: Uses `AstProjectParse` instead of `AstDoculispParse`

**Project Structure Extraction:**
```typescript
// Project files define document collections like:
(documents
    (document
        (source ./readme/_main.dlisp)
        (output ../README.md)
    )
    (document
        (source ./api/_main.dlisp)
        (output ../API_GUIDE.md)
    )
)
```

**Batch Processing Flow:**
1. Parse project structure into `IProjectDocuments`
2. For each document definition:
   - Create child variable table with source/destination
   - Add document ID to global scope (if specified)
   - Process source file using appropriate pipeline (`.dlisp` or `.md`)
   - Generate output using `StringWriter.writeAst()`
3. Return array of results (one per document)

### Pure Doculisp File Pipeline for dlisp Files ###

Pure Doculisp files contain only structure and metadata - no text content allowed. They use the core parsing pipeline with optimizations for pure Doculisp syntax.

#### Object Chain for dlisp Files ####

The `.dlisp` pipeline follows the standard core pattern with Doculisp-specific enhancements:

```
Controller (IController)
    ↓ detects .dlisp extension, sets source/destination variables
IncludeBuilder.parse()
    ↓ [CORE: FileHandler → DocumentParse → Tokenizer → AstParser]
AstDoculispParse (IAstDoculispParser)
    ↓ converts AST to Doculisp semantic structures
IncludeBuilder.parseExternals()
    ↓ [CORE: Include processing pattern]
StringWriter.writeAst()
    ↓ [CORE: Output generation]
```

#### Doculisp-Specific Processing ####

**Unique Characteristics:**
- **Pure Doculisp parsing**: No HTML comment extraction needed
- **Automatic parenthesis wrapping**: `DocumentParse` adds closing parenthesis for proper parsing
- **Structure-only content**: No text content preservation required
- **Optimized parser**: Uses `isDoculisp(true)` parser instead of mixed content parser

**Content Preparation:**
```typescript
// .dlisp files get wrapped for proper parsing
const isDoculispFile = documentPath.extension === '.dlisp';
const toParse = isDoculispFile ? `${documentText})` : documentText;

// Uses specialized Doculisp parser
const parser = isDoculispFile ?
    createStringParser(isDoculisp(true)) :           // Pure Doculisp
    createStringParser(isMultiline(), isComment());  // Mixed content
```

**Processing Advantages:**
- Faster parsing (no HTML comment extraction)
- Direct Doculisp syntax (no `dl` wrapper needed)
- Stricter validation (structure-only enforcement)
- Clean separation of concerns (structure vs content)

### Markdown File Pipeline for md Files ###

Markdown files contain text content with embedded Doculisp blocks in HTML comments. This pipeline handles dual content extraction and processing.

#### Object Chain for md Files ####

The markdown pipeline uses the core processing with specialized content extraction:

```
Controller (IController)
    ↓ detects .md extension, sets source/destination variables
IncludeBuilder.parse()
    ↓ [CORE: FileHandler → DocumentParse → Tokenizer → AstParser]
    ↓ [SPECIAL: Dual content extraction]
AstDoculispParse (IAstDoculispParser)
    ↓ processes extracted Doculisp blocks only
IncludeBuilder.parseExternals()
    ↓ [CORE: Include processing pattern]
StringWriter.writeAst()
    ↓ [CORE: Output generation + text preservation]
```

#### Markdown-Specific Processing ####

**Unique Characteristics:**
- **Dual content extraction**: Separates Doculisp blocks from text content
- **HTML comment parsing**: Extracts `<!-- (dl ...) -->` blocks
- **Text preservation**: Maintains original text content through pipeline
- **Mixed parser strategy**: Uses multiple parser types for different content

**Content Extraction Process:**
```typescript
// Markdown files use mixed content parser
const parser = createStringParser(
    isMultiline(),           // Multi-line text blocks
    isInline(),              // Inline text content
    isComment(),             // HTML comments (Doculisp blocks)
    isWord(),                // Individual words
    isDiscardedNewline(),    // Formatting whitespace
    isKeptWhiteSpaceNoNewLines()  // Preserved whitespace
);

// Results in mixed content:
// - IText parts: Preserved text content
// - ILispBlock parts: Extracted Doculisp code
```

**Processing Flow:**
1. **Content Separation**: Extract Doculisp from `<!-- (dl ...) -->` comments
2. **Doculisp Processing**: Parse extracted blocks using standard pipeline
3. **Text Preservation**: Maintain original text as `IText` parts
4. **Include Integration**: Recursively process includes from Doculisp blocks
5. **Output Merging**: Combine processed Doculisp with preserved text

**HTML Comment Format:**
```markdown
<!-- (dl (section-meta My Document)) -->
Regular markdown text here.
<!-- (dl (# Dynamic Header)) -->
More text content.
<!-- (dl (content (toc numbered-labeled))) -->
```

### Document Output Generation ###

After parsing is complete, all pipelines converge on a common output generation process that transforms the parsed Doculisp structures into final markdown documents.

#### Output Pipeline Architecture ####

The output generation follows a consistent pattern across all file types:

```
Parsed Doculisp Structure (IDoculisp | IEmptyDoculisp)
    ↓ passed to writeAst()
StringWriter (IStringWriter)
    ↓ processes document structure
StringBuilder (IStringBuilder)
    ↓ assembles markdown content
Generated Markdown Output
    ↓ written via Controller._write()
FileHandler (IFileWriter)
    ↓ saves to destination
Final Markdown File
```

#### StringWriter Processing ####

The `StringWriter` is the core output generation component that handles the transformation from Doculisp structures to markdown:

**Document Structure Processing**
- Processes the main document section (`ISectionWriter`)
- Handles all Doculisp components: titles, headers, content, includes, TOCs
- Manages text content preservation (for `.md` files)
- Resolves cross-references and path links

**Markdown Generation Features**
- **Document Headers**: Adds standard generated document warnings and metadata
- **Author Attribution**: Includes author information from variable table
- **Table of Contents**: Generates TOCs with various styles (numbered, bulleted, labeled)
- **Cross-References**: Resolves `get-path` references to relative links
- **Include Processing**: Merges included content into final output
- **Text Preservation**: Maintains original text content alongside generated structures

#### Output Generation Flow ####

**Step 1: Structure Validation**
```typescript
function writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string> {
    if (!astMaybe.success) {
        return astMaybe; // Pass through parsing errors
    }

    if (astMaybe.value.type === 'doculisp-empty') {
        return util.ok(''); // Empty document
    }

    // Continue with document generation...
}
```

**Step 2: Document Header Generation**
- Adds `<!-- GENERATED DOCUMENT DO NOT EDIT! -->` warning
- Includes prettier and markdownlint directives
- Adds Doculisp compiler attribution
- Processes author information from variable table

**Step 3: Content Section Processing**
- Iterates through document sections (`writeSection()`)
- Processes each Doculisp component type:
  - `doculisp-write`: Text content output
  - `doculisp-title`: Document titles with optional subtitles
  - `doculisp-header`: Dynamic headers with proper nesting
  - `doculisp-content`: Include processing and content placement
  - `doculisp-toc`: Table of contents generation
  - `doculisp-path-id`: Cross-reference link resolution

**Step 4: Include Content Integration**
- Recursively processes included documents
- Maintains proper document hierarchy
- Preserves section boundaries
- Handles nested includes with proper indentation

**Step 5: Footer Generation**
- Adds closing markdownlint and prettier directives
- Repeats author attribution
- Adds final generated document warning

#### Output Formatting and Structure ####

**Generated Document Structure**
```markdown
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Author 1 -->
<!-- Written By: Author 2 -->

# Document Title #

### Optional Subtitle ###

## Contents ##
* [Section 1](#section-1)
* [Section 2](#section-2)

## Section 1 ##
[Document content...]

## Section 2 ##
[Document content...]

<!-- Written By: Jason Kerney -->
<!-- Written By: GitHub Copilot -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
```

**Header Level Management**
- Dynamic headers adjust level based on document hierarchy
- `#` creates level 1 headers, `##` creates level 2, etc.
- Proper nesting maintained through include processing
- Headers include both opening and closing hash marks

**Table of Contents Styles**
- `no-table`: No TOC generated
- `unlabeled`: Links only, no section labels
- `labeled`: Section names with links
- `numbered`: Numbered list with links
- `numbered-labeled`: Numbers, labels, and links
- `bulleted`: Bulleted list with links
- `bulleted-labeled`: Bullets, labels, and links

#### Cross-Reference Resolution ####

The output generation handles sophisticated cross-reference resolution through the `writeGetPath()` function:

**Path Resolution Logic**
```typescript
function writeGetPath(astIdPath: IPathId, table: IVariableTable): Result<string> {
    // 1. Look up ID in variable table
    const idPathVariable = table.getValue(astIdPath.id) as IVariableId;

    // 2. Get output destination path
    const output = table.getValue(destKey) as IVariablePath;

    // 3. Calculate relative path
    if (idPath.fullName === outPutPath.fullName) {
        return util.ok(headerLinkText); // Same document - header link only
    }

    // 4. Generate relative file path + header link
    return util.ok('./' + idPath.getRelativeFrom(outPutPath.getContainingDir()) + headerLinkText);
}
```

**Reference Types**
- **Same Document**: `#header-id` for within-document links
- **Cross Document**: `./relative/path.md#header-id` for external documents
- **Empty References**: Return empty string for missing or invalid IDs

#### Variable Table in Output ####

The variable table plays a crucial role in output generation:

**System Variables Used**
- `' source'`: Source file path (with leading space)
- `' destination'`: Output file path (with leading space)
- `author`: Array of author names for attribution
- Document IDs: For cross-reference resolution

**Variable Scope**
- Global variables: Available across all documents in a project
- Document variables: Scoped to individual documents
- Include variables: Inherited by included documents

#### Error Handling in Output ####

Output generation includes comprehensive error handling:

**Validation Errors**
- Missing variable references → Detailed error with location
- Invalid cross-references → Error with ID and document location
- File write failures → File system error propagation

**Recovery Strategies**
- Invalid IDs return empty strings rather than failing entire compilation
- Missing includes skip gracefully with warnings
- File write errors halt compilation with clear error messages

#### Performance Considerations ####

**Output Optimization**
- `StringBuilder` uses efficient string concatenation
- Minimal string copying during generation process
- Lazy evaluation of cross-references
- Streaming output for large documents

**Memory Management**
- Document sections processed sequentially
- Include content loaded on-demand
- Variable tables use copy-on-write for child scopes

### Pipeline Comparison and Selection ###

Now that we've covered the core components and individual pipelines, let's examine how they compare and when each is used.

#### Pipeline Selection Logic ####

The controller automatically selects the appropriate pipeline based on file extension and context:

```typescript
// Primary routing in Controller.compile()
if (sourcePath.extension === '.dlproj') {
    return _compileProject(sourcePath);  // Project pipeline
}

if (sourcePath.extension !== '.dlproj' && !destinationPath) {
    return [util.fail('Must have a destination file.')];
}

// Standard document processing
variableTable.addValue(sourceKey, { type: 'variable-path', value: sourcePath });
if (destinationPath) {
    variableTable.addValue(destKey, { type: 'variable-path', value: destinationPath });
}
return [_compile(variableTable)];  // .dlisp or .md pipeline
```

#### Pipeline Comparison ####

| Aspect | .dlproj Files | .dlisp Files | .md Files |
|--------|---------------|--------------|-----------|
| **Primary Purpose** | Multi-document coordination | Pure structure definition | Mixed content documents |
| **Content Type** | Project definitions | Doculisp structure only | Text + embedded Doculisp |
| **Parser Strategy** | Project structure extraction | Pure Doculisp parsing | Dual content extraction |
| **Include Support** | Via individual documents | Direct recursive includes | Direct recursive includes |
| **Output** | Multiple files (batch) | Single file | Single file |
| **Destination** | Embedded in project | Required parameter | Required parameter |
| **Text Content** | Not applicable | Not allowed | Fully supported |

#### Performance Characteristics ####

**Pipeline Efficiency:**
- **Project files**: Highest overhead (multiple document processing) but efficient for batch operations
- **Doculisp files**: Fastest parsing (no HTML extraction) with moderate include overhead
- **Markdown files**: Moderate parsing overhead (dual extraction) with full feature support

**Memory Usage:**
- All pipelines use streaming processing to minimize memory footprint
- Include processing loads files on-demand rather than pre-loading
- Variable tables use copy-on-write for efficient child scope management

The controller automatically selects the appropriate pipeline based on file extension:

```typescript
// In Controller.compile()
if (sourcePath.extension === '.dlproj') {
    return _compileProject(sourcePath);  // Project pipeline
}

// In IncludeBuilder._parse() and DocumentParse
const isDoculispFile = documentPath.extension === '.dlisp' ||
                      documentPath.extension === '.dlproj';

if (isDoculispFile) {
    // Use Doculisp parser - no HTML comment extraction
    parser = parserBuilder.createStringParser(
        partParsers.isDiscardedNewline(),
        partParsers.isKeptWhiteSpaceNoNewLines(),
        partParsers.isDoculisp(true)
    );
} else {
    // Use markdown parser - extract Doculisp from HTML comments
    parser = parserBuilder.createStringParser(
        partParsers.isDiscardedNewline(),
        partParsers.isKeptWhiteSpaceNoNewLines(),
        partParsers.isMultiline(),
        partParsers.isInline(),
        partParsers.isComment(),
        partParsers.isWord()
    );
}
```

### Performance and Memory Considerations ###

**Container Object Lifecycle**
- Most objects are singletons - created once and reused
- `stringWriter` is NOT singleton - new instance per operation
- Working directory changes are thread-safe via try/finally blocks

**Memory Management**
- Token streams are processed sequentially, not stored entirely in memory
- AST structures are built incrementally
- Large files are processed in chunks where possible

**Dependency Resolution**
- Container automatically resolves all dependencies
- Circular dependency detection prevents infinite loops
- Lazy loading - objects created only when needed

### Debugging and Troubleshooting ###

**Common Issues by Pipeline**

**Project Files (.dlproj)**
- Invalid project syntax → `AstProjectParse` errors
- Missing source files → `FileHandler` load errors
- Circular project references → Include validation errors

**Doculisp Files (.dlisp)**
- Unclosed parentheses → `DocumentParse` wrapping errors
- Invalid Doculisp syntax → `AstDoculispParse` errors
- Invalid include paths → `IncludeBuilder` validation errors

**Markdown Files (.md)**
- Malformed HTML comments → `DocumentParse` extraction errors
- Mixed content issues → Parser strategy conflicts
- Invalid embedded Doculisp → `AstDoculispParse` errors

**Debugging Container Issues**
```typescript
// Get container debugging info
const container = await containerPromise;
const modules = container.getModuleList();
console.log('Available modules:', modules);

// Test individual pipeline components
const tokenizer = container.buildAs<ITokenizer>('tokenizer');
const result = tokenizer.tokenize(content, path);
```

### Extension Points ###

The pipeline architecture supports extension through the container system:

**Custom Parsers**
- Register new parsers for additional file types
- Extend existing parsers with additional syntax support
- Override default parsing behavior for specific use cases

**Custom Output Generators**
- Replace `stringWriter` with custom output formats
- Add post-processing steps
- Integrate with external tooling

**Custom File Handlers**
- Support additional file systems or protocols
- Add caching or optimization layers
- Integrate with version control systems

```typescript
// Example: Register custom output generator
const container = await containerPromise;
container.registerBuilder(
    (util: IUtil) => new CustomOutputGenerator(util),
    ['util'],
    'customWriter',
    true
);
```

This comprehensive understanding of the parsing pipelines enables effective use of the container system and provides the foundation for extending Doculisp's capabilities.

## Detailed Compilation Instructions ##



#### DocumentParse API Reference ####

The `DocumentParse` component is a core parsing service in Doculisp that extracts and processes content from text documents. It's responsible for separating text content from embedded Doculisp blocks and preparing them for further processing in the compilation pipeline.

#### Overview ####

`DocumentParse` is the first stage in the Doculisp compilation pipeline that handles raw document text. It determines the file type, applies appropriate parsing strategies, and creates a structured representation of the document content that can be processed by subsequent pipeline stages.

**Primary Responsibilities:**
- Detect file type based on extension (`.md`, `.dlisp`, `.dlproj`)
- Extract Doculisp blocks from HTML comments in markdown files
- Parse pure Doculisp syntax in `.dlisp` files
- Preserve text content alongside extracted structure
- Handle nested code blocks and preserve formatting
- Validate document structure and syntax

##### Container Registration #####

DocumentParse is registered in the container system as:

```typescript
{
    name: 'documentParse',
    singleton: true,
    dependencies: ['searches', 'internals', 'util', 'trimArray']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const documentParser = container.buildAs<DocumentParser>('documentParse');
```

#### Type Definitions ####

Understanding the types used by DocumentParse is essential for working with it effectively.

##### Core Function Type #####

```typescript
type DocumentParser = (text: string, projectLocation: IProjectLocation) => Result<DocumentMap>;
```

The `DocumentParser` is a function that takes document text and location information, returning either a successful `DocumentMap` or an error.

##### Input Types #####

**Primary Parameters:**

```typescript
// Raw document text content
text: string

// Location context for the document
projectLocation: IProjectLocation
```

**IProjectLocation Interface:**
```typescript
interface IProjectLocation {
    readonly documentPath: IPath;      // File path with extension
    readonly documentDepth: number;    // Inclusion nesting level (1+)
    readonly documentIndex: number;    // Document sequence number (1+)
}
```

**Key Constraints:**
- `documentDepth` must be ≥ 1 (validates document is properly nested)
- `documentIndex` must be ≥ 1 (validates document ordering)
- `documentPath` must have valid file extension (`.md`, `.dlisp`, `.dlproj`)

##### Output Types #####

**Success Result:**
```typescript
Result<DocumentMap> = {
    success: true,
    value: DocumentMap
}
```

**DocumentMap Structure:**
```typescript
type DocumentMap = {
    readonly parts: DocumentPart[];           // Parsed content segments
    readonly projectLocation: IProjectLocation; // Original location context
}
```

**DocumentPart Union:**
```typescript
type DocumentPart = IText | ILispBlock;

// Text content (preserved from markdown)
interface IText {
    readonly text: string;        // Original text content
    readonly location: ILocation; // Position in source
    readonly type: 'text';
}

// Extracted Doculisp code
interface ILispBlock {
    readonly text: string;        // Doculisp code content
    readonly location: ILocation; // Position in source
    readonly type: 'lisp';
}
```

**Location Information:**
```typescript
interface ILocation extends IProjectLocation {
    readonly line: number;                    // Line number (1-based)
    readonly char: number;                    // Character position (1-based)
    increaseLine(by?: number): ILocation;     // Create new location with line offset
    increaseChar(by?: number): ILocation;     // Create new location with char offset
    compare(other: ILocation): IsOrder;       // Compare positions (-1, 0, 1)
}
```

**Error Result:**
```typescript
Result<DocumentMap> = {
    success: false,
    message: string,              // Detailed error description
    documentPath?: IPath          // File where error occurred
}
```

#### Parsing Strategies by File Type ####

DocumentParse uses different parsing strategies based on file extension, each optimized for the specific content type and use case.

##### Markdown Files #####

**Strategy:** Dual content extraction - separates text from embedded Doculisp blocks

**Input Processing:**
```typescript
// Original text is preserved as-is
const toParse = documentText;

// Uses mixed content parser
const parser = parserBuilder.createStringParser(
    partParsers.isDiscardedNewline(),      // Handle formatting newlines
    partParsers.isKeptWhiteSpaceNoNewLines(), // Preserve significant whitespace
    partParsers.isMultiline(),             // Multi-line code blocks
    partParsers.isInline(),                // Inline code spans
    partParsers.isComment(),               // HTML comments (Doculisp blocks)
    partParsers.isWord()                   // Individual words
);
```

**Content Extraction:**
- Text content: Preserved in `IText` parts
- Doculisp blocks: Extracted from `<!-- (dl ...) -->` comments into `ILispBlock` parts
- Code blocks: Treated as text content (not processed as Doculisp)
- Formatting: Whitespace and newlines preserved appropriately

**Example Input:**
````markdown
# My Document

Some introductory text here.

<!-- (dl (section-meta My Section)) -->

More content after the Doculisp block.

```typescript
console.log("This code block is preserved as text");
```

<!-- (dl (# Dynamic Header)) -->

Final paragraph.
````

**Resulting DocumentPart Array:**
```typescript
[
    { type: 'text', text: '# My Document\n\nSome introductory text here.\n\n', location: {...} },
    { type: 'lisp', text: '(section-meta My Section)', location: {...} },
    { type: 'text', text: '\n\nMore content after the Doculisp block.\n\n```typescript\nconsole.log("This code block is preserved as text");\n```\n\n', location: {...} },
    { type: 'lisp', text: '(# Dynamic Header)', location: {...} },
    { type: 'text', text: '\n\nFinal paragraph.', location: {...} }
]
```

##### Pure Doculisp Files #####

**Strategy:** Pure structure parsing - processes only Doculisp syntax

**Input Processing:**
```typescript
// Closing parenthesis added for proper parsing
const toParse = `${documentText})`;

// Uses Doculisp-only parser
const parser = parserBuilder.createStringParser(
    partParsers.isDiscardedNewline(),         // Handle formatting
    partParsers.isKeptWhiteSpaceNoNewLines(), // Preserve whitespace
    partParsers.isDoculisp(true)              // Pure Doculisp parsing
);
```

**Content Processing:**
- Only Doculisp syntax allowed - no text content
- Automatic parenthesis balancing
- Strict syntax validation
- All content becomes `ILispBlock` parts

**Example Input:**
```lisp
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
        (Section ./examples.md)
    )
)

(content
    (toc numbered-labeled)
)

(# Main Header)

(## Sub Header)
```

**Resulting DocumentPart Array:**
```typescript
[
    { type: 'lisp', text: '(section-meta\n    (title My Document)\n    (include\n        (Section ./intro.md)\n        (Section ./examples.md)\n    )\n)', location: {...} },
    { type: 'lisp', text: '(content\n    (toc numbered-labeled)\n)', location: {...} },
    { type: 'lisp', text: '(# Main Header)', location: {...} },
    { type: 'lisp', text: '(## Sub Header)', location: {...} }
]
```

**Validation Rules:**
- All content must be valid Doculisp syntax
- No text content outside parentheses allowed
- Parentheses must balance correctly
- No `(dl ...)` wrappers allowed (unlike in markdown comments where they are required)

##### Project Files #####

**Strategy:** Project structure parsing - similar to `.dlisp` but with project-specific validation

**Input Processing:**
```typescript
// Same as .dlisp files
const toParse = `${documentText})`;

// Uses same parser as .dlisp files
const parser = parserBuilder.createStringParser(
    partParsers.isDiscardedNewline(),
    partParsers.isKeptWhiteSpaceNoNewLines(),
    partParsers.isDoculisp(true)
);
```

**Content Requirements:**
- Must contain `(documents ...)` structure
- Each document must specify `source` and `output` paths
- Optional document `id` for cross-referencing

**Example Input:**
```lisp
(documents
    (document
        (id readme)
        (source ./readme/_main.dlisp)
        (output ../README.md)
    )
    (document
        (id api-guide)
        (source ./api-guide/_main.dlisp)
        (output ../API_GUIDE.md)
    )
)
```

#### Usage Examples ####

Practical examples showing how to use DocumentParse in different scenarios.

##### Basic Usage Pattern #####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';

async function parseDocument() {
    // Initialize container
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Create project location
    const documentPath = pathConstructor.buildPath('./example.md');
    const projectLocation = {
        documentPath,
        documentDepth: 1,      // Top-level document
        documentIndex: 1       // First document in sequence
    };

    // Parse document
    const content = `# My Document\n\n<!-- (dl (section-meta Example)) -->\n\nContent here.`;
    const result = documentParser(content, projectLocation);

    if (result.success) {
        console.log('Parsed successfully:', result.value);
        result.value.parts.forEach(part => {
            console.log(`${part.type}: ${part.text}`);
        });
    } else {
        console.error('Parse failed:', result.message);
    }
}
```

##### Processing Different File Types #####

**Markdown File Processing:**
```typescript
async function parseMarkdownFile() {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const markdownContent = `
# Welcome to My Project

This is regular markdown content that will be preserved.

<!-- (dl (section-meta Documentation)) -->

More markdown content here.

\`\`\`typescript
// This code block is preserved as text
function example() {
    return "hello";
}
\`\`\`

<!-- (dl (# Overview)) -->

Final content.
`;

    const projectLocation = {
        documentPath: pathConstructor.buildPath('./docs/readme.md'),
        documentDepth: 1,
        documentIndex: 1
    };

    const result = documentParser(markdownContent, projectLocation);

    if (result.success) {
        // Will contain alternating IText and ILispBlock parts
        const textParts = result.value.parts.filter(p => p.type === 'text');
        const lispParts = result.value.parts.filter(p => p.type === 'lisp');

        console.log(`Found ${textParts.length} text sections`);
        console.log(`Found ${lispParts.length} Doculisp blocks`);
    }
}
```

**Pure Doculisp File Processing:**
```typescript
async function parseDoculispFile() {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const doculispContent = `
(section-meta
    (title API Reference)
    (include
        (Section ./overview.md)
        (Section ./examples.md)
    )
)

(content
    (toc numbered-labeled)
)

(# Introduction)

(## Getting Started)
`;

    const projectLocation = {
        documentPath: pathConstructor.buildPath('./docs/_main.dlisp'),
        documentDepth: 1,
        documentIndex: 1
    };

    const result = documentParser(doculispContent, projectLocation);

    if (result.success) {
        // All parts will be ILispBlock type
        const allLisp = result.value.parts.every(p => p.type === 'lisp');
        console.log('All parts are Doculisp blocks:', allLisp);

        result.value.parts.forEach((part, index) => {
            console.log(`Block ${index + 1}:`, part.text);
        });
    }
}
```

**Project File Processing:**
```typescript
async function parseProjectFile() {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectContent = `
(documents
    (document
        (id main-readme)
        (source ./readme/_main.dlisp)
        (output ../README.md)
    )
    (document
        (id api-guide)
        (source ./api-guide/_main.dlisp)
        (output ../API_GUIDE.md)
    )
    (document
        (source ./changelog/_main.dlisp)
        (output ../CHANGELOG.md)
    )
)
`;

    const projectLocation = {
        documentPath: pathConstructor.buildPath('./docs/docs.dlproj'),
        documentDepth: 1,
        documentIndex: 1
    };

    const result = documentParser(projectContent, projectLocation);

    if (result.success) {
        // Contains project structure as Doculisp blocks
        console.log('Project structure parsed successfully');

        // Note: Further processing by AstProjectParse would extract
        // the document definitions from these Doculisp blocks
    }
}
```

##### Advanced Usage with Error Handling #####

```typescript
async function robustDocumentParsing(filePath: string, content: string) {
    try {
        const container = await containerPromise;
        const documentParser = container.buildAs<DocumentParser>('documentParse');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

        // Validate inputs
        if (!content.trim()) {
            console.warn('Empty document content');
        }

        // Create project location with validation
        const documentPath = pathConstructor.buildPath(filePath);
        const projectLocation = {
            documentPath,
            documentDepth: 1,
            documentIndex: 1
        };

        // Parse with comprehensive error handling
        const result = documentParser(content, projectLocation);

        if (result.success) {
            const documentMap = result.value;

            // Analyze parsing results
            const stats = {
                totalParts: documentMap.parts.length,
                textParts: documentMap.parts.filter(p => p.type === 'text').length,
                lispParts: documentMap.parts.filter(p => p.type === 'lisp').length,
                fileType: documentPath.extension
            };

            console.log('Parse statistics:', stats);

            // Validate expected content based on file type
            if (documentPath.extension === '.dlisp' && stats.textParts > 0) {
                console.warn('Pure Doculisp file contains text content');
            }

            if (documentPath.extension === '.md' && stats.lispParts === 0) {
                console.warn('Markdown file contains no Doculisp blocks');
            }

            return { success: true, documentMap, stats };

        } else {
            // Handle specific error types
            console.error(`Parse failed for ${filePath}:`, result.message);

            if (result.message.includes('Document Depth')) {
                console.error('Invalid document depth - must be ≥ 1');
            } else if (result.message.includes('Document Index')) {
                console.error('Invalid document index - must be ≥ 1');
            } else if (result.message.includes('parenthesis')) {
                console.error('Doculisp syntax error - check parentheses balancing');
            }

            return { success: false, error: result.message };
        }

    } catch (error) {
        console.error('Unexpected error during parsing:', error);
        return { success: false, error: error.message };
    }
}
```

#### When to Use DocumentParse ####

Understanding when and why to use DocumentParse directly versus through higher-level APIs.

##### Direct Usage Scenarios #####

**1. Custom Processing Pipelines**
- Building custom compilation tools
- Implementing alternative output formats
- Creating specialized validation tools
- Developing IDE language support

**2. Content Analysis**
- Extracting metrics from documentation
- Validating Doculisp syntax
- Analyzing document structure
- Building documentation tooling

**3. Testing and Development**
- Unit testing Doculisp syntax
- Validating parsing behavior
- Debugging compilation issues
- Performance analysis

**Example - Content Analysis Tool:**
```typescript
async function analyzeDoculispUsage(files: string[]) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const analysis = {
        totalFiles: files.length,
        totalDoculispBlocks: 0,
        syntaxErrors: 0,
        filesByType: { md: 0, dlisp: 0, dlproj: 0 }
    };

    for (const [index, filePath] of files.entries()) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const documentPath = pathConstructor.buildPath(filePath);

            const projectLocation = {
                documentPath,
                documentDepth: 1,
                documentIndex: index + 1
            };

            const result = documentParser(content, projectLocation);

            if (result.success) {
                const lispBlocks = result.value.parts.filter(p => p.type === 'lisp');
                analysis.totalDoculispBlocks += lispBlocks.length;

                const extension = documentPath.extension.slice(1); // Remove dot
                if (extension in analysis.filesByType) {
                    analysis.filesByType[extension]++;
                }
            } else {
                analysis.syntaxErrors++;
                console.error(`Error in ${filePath}: ${result.message}`);
            }

        } catch (error) {
            console.error(`Failed to process ${filePath}:`, error.message);
        }
    }

    return analysis;
}
```

##### Alternative APIs #####

**High-Level Controller API:**
```typescript
// For most compilation tasks
const controller = container.buildAs<IController>('controller');
const results = controller.compile(sourcePath, destinationPath);
```

**IncludeBuilder API:**
```typescript
// For processing with includes and variable context
const includeBuilder = container.buildAs<IIncludeBuilder>('includeBuilder');
const result = includeBuilder.parse(variableTable);
```

**Use DocumentParse directly when:**
- You need fine-grained control over parsing
- Working with raw content (not files)
- Building custom tools or analysis
- Testing specific parsing scenarios
- Performance-critical applications requiring minimal overhead

**Use higher-level APIs when:**
- Standard compilation workflows
- File-based processing
- Include resolution needed
- Variable substitution required
- Full pipeline processing desired

#### Common Error Patterns ####

Understanding common mistakes and how to avoid them.

##### Validation Errors #####

**Invalid Project Location:**
```typescript
// ❌ Invalid - depth and index must be ≥ 1
const invalidLocation = {
    documentPath: pathConstructor.buildPath('./test.md'),
    documentDepth: 0,    // Must be ≥ 1
    documentIndex: 0     // Must be ≥ 1
};

// ✅ Valid
const validLocation = {
    documentPath: pathConstructor.buildPath('./test.md'),
    documentDepth: 1,
    documentIndex: 1
};
```

**Incorrect File Extensions:**
```typescript
// ❌ Unsupported file extension
const unsupportedPath = pathConstructor.buildPath('./document.txt');

// ✅ Supported extensions
const markdownPath = pathConstructor.buildPath('./document.md');
const doculispPath = pathConstructor.buildPath('./document.dlisp');
const projectPath = pathConstructor.buildPath('./project.dlproj');
```

##### Syntax Errors #####

**Doculisp Syntax Issues:**
```typescript
// ❌ Unbalanced parentheses in .dlisp file
const badDoculisp = `
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    // Missing closing parenthesis
)
`;

// ✅ Properly balanced
const goodDoculisp = `
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    )
)
`;
```

**HTML Comment Issues in Markdown:**
```typescript
// ❌ Unclosed HTML comment
const badMarkdown = `
# Title
<!-- (dl (section-meta Example))
Content here.
`;

// ✅ Properly closed comment
const goodMarkdown = `
# Title
<!-- (dl (section-meta Example)) -->
Content here.
`;
```

##### Content Type Mismatches #####

**Text in Pure Doculisp Files:**
```typescript
// ❌ Text content not allowed in .dlisp files
const badDlisp = `
(section-meta Title)

This text content will cause parsing errors.

(content (toc))
`;

// ✅ Only Doculisp structure
const goodDlisp = `
(section-meta Title)

(content (toc))
`;
```

**Invalid Doculisp in Comments:**
```typescript
// ❌ Invalid Doculisp syntax in comment
const badComment = `
# Title
<!-- (dl section-meta Missing Parentheses) -->
Content.
`;

// ✅ Valid Doculisp syntax
const goodComment = `
# Title
<!-- (dl (section-meta Proper Parentheses)) -->
Content.
`;
```

#### Performance Considerations ####

Best practices for optimal performance when using DocumentParse.

##### Memory Management #####

**Large Document Handling:**
```typescript
// For very large documents, consider chunking
async function parseChunkedDocument(content: string, chunkSize = 10000) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');

    if (content.length <= chunkSize) {
        // Small document - parse normally
        return documentParser(content, projectLocation);
    }

    // Large document - implement custom chunking strategy
    // Note: This is a simplified example - real implementation
    // would need to handle Doculisp block boundaries properly
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
    }

    // Process chunks and merge results
    // Implementation details depend on specific requirements
}
```

**Container Reuse:**
```typescript
// ✅ Reuse container and parser instances
class DocumentProcessor {
    private container: any;
    private documentParser: DocumentParser;

    async initialize() {
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
    }

    parseDocument(content: string, location: IProjectLocation) {
        // Reuse parser instance for multiple documents
        return this.documentParser(content, location);
    }
}

// ❌ Creating new parser for each document
async function inefficientParsing(documents: Array<{content: string, location: IProjectLocation}>) {
    for (const doc of documents) {
        const container = await containerPromise;  // Expensive!
        const parser = container.buildAs<DocumentParser>('documentParse');
        parser(doc.content, doc.location);
    }
}
```

##### Parser Strategy Optimization #####

**Content Type Detection:**
```typescript
// Optimize by detecting content type early
function getOptimalParsingStrategy(filePath: string, content: string) {
    const extension = path.extname(filePath);

    if (extension === '.dlisp' || extension === '.dlproj') {
        return 'doculisp-only';  // Fastest - no HTML comment extraction
    }

    if (extension === '.md') {
        // Check if document actually contains Doculisp blocks
        if (!content.includes('<!-- (dl ')) {
            return 'text-only';     // Could optimize for pure text
        }
        return 'mixed-content';     // Full markdown parsing needed
    }

    return 'unknown';
}
```

**Batch Processing:**
```typescript
// Efficient batch processing pattern
async function processBatch(documents: DocumentInput[]) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const results = [];

    // Group by file type for optimized processing
    const grouped = documents.reduce((acc, doc) => {
        const ext = path.extname(doc.filePath);
        (acc[ext] = acc[ext] || []).push(doc);
        return acc;
    }, {});

    // Process each group with type-specific optimizations
    for (const [extension, docs] of Object.entries(grouped)) {
        for (const [index, doc] of docs.entries()) {
            const documentPath = pathConstructor.buildPath(doc.filePath);
            const projectLocation = {
                documentPath,
                documentDepth: doc.depth || 1,
                documentIndex: index + 1
            };

            const result = documentParser(doc.content, projectLocation);
            results.push({ ...doc, result });
        }
    }

    return results;
}
```

This comprehensive guide provides everything needed to understand and effectively use the DocumentParse API in Doculisp applications. 😊

#### Tokenizer API Reference ####

The `Tokenizer` component is the second stage in the Doculisp compilation pipeline that converts parsed document content into structured tokens. It takes the output from `DocumentParse` and transforms Doculisp blocks into individual tokens (atoms, parameters, parentheses) while preserving text content and location information.

#### Overview ####

The Tokenizer bridges the gap between raw document parsing and Abstract Syntax Tree (AST) generation. It processes `DocumentMap` structures and creates `TokenizedDocument` outputs that contain discrete tokens representing each element of the Doculisp syntax.

**Primary Responsibilities:**
- Convert Doculisp blocks into individual tokens
- Preserve text content as text tokens
- Handle nested parentheses and comments
- Process escaped characters in parameters
- Maintain precise location tracking for error reporting
- Validate Doculisp syntax at the token level

##### Container Registration #####

Tokenizer is registered in the container system as:

```typescript
{
    name: 'tokenizer',
    singleton: true,
    dependencies: ['searches', 'internals', 'util']
}
```

Access it from the container:
```typescript
const container = await containerPromise;
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
```

#### Type Definitions ####

Understanding the types used by the Tokenizer is essential for working with it effectively.

##### Core Function Type #####

```typescript
type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>;
```

The `TokenFunction` is a function that takes a parsed document map and returns either a successful `TokenizedDocument` or an error.

##### Input Types #####

**Primary Parameter:**

```typescript
// Result from DocumentParse containing parsed content
documentMap: Result<DocumentMap>
```

**DocumentMap Structure (from DocumentParse):**
```typescript
type DocumentMap = {
    readonly parts: DocumentPart[];           // Content segments
    readonly projectLocation: IProjectLocation; // Document context
}

type DocumentPart = IText | ILispBlock;

interface IText {
    readonly text: string;        // Original text content
    readonly location: ILocation; // Position in source
    readonly type: 'text';
}

interface ILispBlock {
    readonly text: string;        // Doculisp code content
    readonly location: ILocation; // Position in source
    readonly type: 'lisp';
}
```

##### Output Types #####

**Success Result:**
```typescript
Result<TokenizedDocument> = {
    success: true,
    value: TokenizedDocument
}
```

**TokenizedDocument Structure:**
```typescript
type TokenizedDocument = {
    readonly tokens: Token[];                    // Array of individual tokens
    readonly projectLocation: IProjectLocation; // Original document context
}
```

**Token Union Type:**
```typescript
type Token = TextToken | CloseParenthesisToken | AtomToken | ParameterToken;
```

**Individual Token Types:**
```typescript
// Text content (preserved from markdown)
type TextToken = {
    readonly text: string;        // Original text content
    readonly location: ILocation; // Position in source
    readonly type: 'token - text';
}

// Doculisp atoms (function names, keywords)
type AtomToken = {
    readonly text: string;        // Atom name (e.g., "section-meta", "title")
    readonly location: ILocation; // Position in source
    readonly type: 'token - atom';
}

// Parameters (arguments to atoms)
type ParameterToken = {
    readonly text: string;        // Parameter value (processed/unescaped)
    readonly location: ILocation; // Position in source
    readonly type: 'token - parameter';
}

// Closing parentheses
type CloseParenthesisToken = {
    readonly location: ILocation; // Position in source
    readonly type: 'token - close parenthesis';
}
```

**Error Result:**
```typescript
Result<TokenizedDocument> = {
    success: false,
    message: string,              // Detailed error description
    documentPath?: IPath          // File where error occurred
}
```

#### Tokenization Process ####

The Tokenizer processes document content through several specialized parsing functions, each handling different types of content.

##### Token Processing Strategy #####

The Tokenizer uses a multi-pass strategy to convert content:

```typescript
// High-level tokenization flow
function tokenize(documentMap: Result<DocumentMap>): Result<TokenizedDocument> {
    // 1. Validate input
    if (!documentMap.success) return documentMap;

    // 2. Process each document part
    for (const part of documentMap.value.parts) {
        if (part.type === 'text') {
            // Add text content as single text token
            addTextToken(part);
        } else if (part.type === 'lisp') {
            // Parse Doculisp block into individual tokens
            const tokens = tokenizeDoculispBlock(part);
            addTokens(tokens);
        }
    }

    // 3. Return tokenized document
    return createTokenizedDocument();
}
```

##### Text Token Processing #####

Text content from markdown files is preserved as-is in text tokens:

**Input Processing:**
```typescript
// Text parts are passed through unchanged
if (part.type === 'text') {
    totalTokens.addToken({
        type: 'token - text',
        text: part.text,           // Original text preserved
        location: part.location,   // Original location preserved
    });
}
```

**Characteristics:**
- **Direct preservation**: Text content is not processed or modified
- **Location tracking**: Original line/character positions maintained
- **Single token per part**: Each text part becomes one text token
- **Whitespace preservation**: All formatting and spacing preserved

##### Doculisp Block Tokenization #####

Doculisp blocks undergo detailed parsing to extract individual syntax elements:

**Processing Pipeline:**
```typescript
// Doculisp tokenization uses specialized parsers
const parser = internals.createStringParser(
    tokenizeWhiteSpace,      // Handle spaces and newlines
    tokenizeComment,         // Process commented blocks
    tokenizeParenthesis,     // Handle opening/closing parentheses
    tokenizeParameter,       // Extract parameter values
    tokenizeAtom            // Extract atom names
);
```

**Token Extraction Rules:**

1. **Whitespace Handling**: Spaces and newlines are discarded but used for location tracking
2. **Parentheses Processing**: Opening parentheses trigger atom parsing, closing parentheses create tokens
3. **Atom Recognition**: First non-whitespace content after opening parenthesis
4. **Parameter Extraction**: Content following atoms, with escape sequence processing
5. **Comment Processing**: Handles `(*...)` comment blocks with nested parsing

#### Token Types and Examples ####

Understanding how different Doculisp constructs become tokens.

##### Atom Tokens #####

Atoms are the function names or keywords in Doculisp syntax:

**Input Examples:**
```doculisp
(section-meta)          → AtomToken: "section-meta"
(title My Document)     → AtomToken: "title"
(# Header)              → AtomToken: "#"
(include)               → AtomToken: "include"
(content)               → AtomToken: "content"
```

**Token Generation:**
```typescript
// Atom recognition pattern
const atomPattern = /^[^\(\)\s]+/;

// Example atom token result
{
    type: 'token - atom',
    text: 'section-meta',
    location: { documentPath, line: 1, char: 2, ... }
}
```

**Atom Rules:**
- Must be first element after opening parenthesis
- Cannot contain parentheses, spaces, or whitespace
- Case-sensitive
- Can include hyphens, underscores, numbers, and special characters (except parentheses)

##### Parameter Tokens #####

Parameters are the arguments passed to atoms:

**Input Examples:**
```doculisp
(title My Document Title)         → ParameterToken: "My Document Title"
(author John Doe)                 → ParameterToken: "John Doe"
(id my-unique-identifier)         → ParameterToken: "my-unique-identifier"
(Section ./docs/intro.md)         → ParameterToken: "./docs/intro.md"
```

**Escape Sequence Processing:**
```doculisp
(title The Great \(Escape\))      → ParameterToken: "The Great (Escape)"
(title Contains \\backslash)       → ParameterToken: "Contains \backslash"
(title C:\Windows\System32)        → ParameterToken: "C:\Windows\System32"
```

**Parameter Processing:**
```typescript
// Parameter recognition pattern
const paramPattern = /^([^\s\(\)\\]+|\\\)|\\\(|\\\w|\\\\)+([^\(\)\\]+|\\\)|\\\(|\\\w|\\\\)*/;

// Escape sequence handling
const processedText = parameterValue
    .trim()
    .replace('\\(', '(')     // Unescape opening parenthesis
    .replace('\\)', ')')     // Unescape closing parenthesis
    .replace('\\\\', '\\');  // Unescape backslash

// Example parameter token
{
    type: 'token - parameter',
    text: 'My Document Title',  // Processed/unescaped text
    location: { documentPath, line: 1, char: 7, ... }
}
```

**Parameter Rules:**
- Follow atoms in Doculisp expressions
- Can contain any characters except unescaped parentheses
- Whitespace is preserved within parameters
- Must escape parentheses and backslashes with backslash
- Parameters are trimmed and unescaped during processing

##### Parenthesis Tokens #####

Parentheses structure the Doculisp syntax and create parsing context:

**Opening Parentheses:**
- Do not generate tokens directly
- Trigger atom parsing for the following content
- Set parsing state to expect atom next

**Closing Parentheses:**
```typescript
// Closing parenthesis token
{
    type: 'token - close parenthesis',
    location: { documentPath, line: 1, char: 15, ... }
    // Note: no text property - just marks structure
}
```

**Nested Structure Example:**
```doculisp
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    )
)
```

**Resulting Token Sequence:**
1. AtomToken: "section-meta"
2. AtomToken: "title"
3. ParameterToken: "My Document"
4. CloseParenthesisToken
5. AtomToken: "include"
6. AtomToken: "Section"
7. ParameterToken: "./intro.md"
8. CloseParenthesisToken
9. CloseParenthesisToken
10. CloseParenthesisToken

##### Text Tokens #####

Text tokens preserve markdown content from mixed-content files:

**Input Example:**
```markdown
# My Document

Some introductory text.

<!-- (dl (section-meta Example)) -->

More content here.
```

**Resulting Tokens:**
```typescript
[
    {
        type: 'token - text',
        text: '# My Document\n\nSome introductory text.\n\n',
        location: { line: 1, char: 1, ... }
    },
    {
        type: 'token - atom',
        text: 'section-meta',
        location: { line: 5, char: 10, ... }
    },
    {
        type: 'token - parameter',
        text: 'Example',
        location: { line: 5, char: 23, ... }
    },
    {
        type: 'token - close parenthesis',
        location: { line: 5, char: 31, ... }
    },
    {
        type: 'token - text',
        text: '\n\nMore content here.\n',
        location: { line: 5, char: 35, ... }
    }
]
```

#### Usage Examples ####

Practical examples showing how to use the Tokenizer in different scenarios.

##### Basic Usage Pattern #####

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';

async function tokenizeDocument() {
    // Initialize container
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Create project location
    const documentPath = pathConstructor.buildPath('./example.md');
    const projectLocation = {
        documentPath,
        documentDepth: 1,
        documentIndex: 1
    };

    // Parse document first
    const content = `# My Document\n\n<!-- (dl (section-meta Example)) -->\n\nContent here.`;
    const documentMap = documentParser(content, projectLocation);

    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return;
    }

    // Tokenize the parsed document
    const tokenizedResult = tokenizer(documentMap);

    if (tokenizedResult.success) {
        console.log('Tokenization successful');
        tokenizedResult.value.tokens.forEach((token, index) => {
            console.log(`Token ${index + 1}: ${token.type} - "${token.text || 'N/A'}"`);
        });
    } else {
        console.error('Tokenization failed:', tokenizedResult.message);
    }
}
```

##### Processing Different Content Types #####

**Markdown File with Mixed Content:**
```typescript
async function tokenizeMarkdownFile() {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const markdownContent = `
# Welcome

This is regular markdown content.

<!-- (dl
    (section-meta
        (title Documentation)
        (author John Doe)
    )
) -->

More content here.

<!-- (dl (# Overview)) -->

Final section.
`;

    const projectLocation = {
        documentPath: pathConstructor.buildPath('./docs/readme.md'),
        documentDepth: 1,
        documentIndex: 1
    };

    // Parse then tokenize
    const documentMap = documentParser(markdownContent, projectLocation);
    const tokenizedResult = tokenizer(documentMap);

    if (tokenizedResult.success) {
        const tokens = tokenizedResult.value.tokens;

        // Analyze token distribution
        const tokenCounts = tokens.reduce((acc, token) => {
            acc[token.type] = (acc[token.type] || 0) + 1;
            return acc;
        }, {});

        console.log('Token distribution:', tokenCounts);
        // Expected: text tokens, atom tokens, parameter tokens, close parenthesis tokens

        // Extract just the Doculisp tokens
        const doculispTokens = tokens.filter(t => t.type !== 'token - text');
        console.log('Doculisp tokens:', doculispTokens.length);
    }
}
```

**Pure Doculisp File:**
```typescript
async function tokenizeDoculispFile() {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const doculispContent = `
(section-meta
    (title API Reference)
    (subtitle Complete Reference Guide)
    (author Development Team)
    (include
        (Overview ./overview.md)
        (Examples ./examples.md)
    )
)

(content
    (toc numbered-labeled)
)

(# Introduction)

(## Getting Started)
`;

    const projectLocation = {
        documentPath: pathConstructor.buildPath('./docs/_main.dlisp'),
        documentDepth: 1,
        documentIndex: 1
    };

    const documentMap = documentParser(doculispContent, projectLocation);
    const tokenizedResult = tokenizer(documentMap);

    if (tokenizedResult.success) {
        const tokens = tokenizedResult.value.tokens;

        // All tokens should be Doculisp tokens (no text tokens)
        const hasTextTokens = tokens.some(t => t.type === 'token - text');
        console.log('Contains text tokens:', hasTextTokens); // Should be false

        // Extract atom sequence to understand structure
        const atoms = tokens
            .filter(t => t.type === 'token - atom')
            .map(t => t.text);
        console.log('Atom sequence:', atoms);
        // Expected: ["section-meta", "title", "subtitle", "author", "include", "Overview", "Examples", "content", "toc", "#", "##"]

        // Extract parameters
        const parameters = tokens
            .filter(t => t.type === 'token - parameter')
            .map(t => t.text);
        console.log('Parameters:', parameters);
        // Expected: ["API Reference", "Complete Reference Guide", "Development Team", "./overview.md", "./examples.md", "numbered-labeled", "Introduction", "Getting Started"]
    }
}
```

##### Advanced Token Analysis #####

```typescript
async function analyzeTokenStructure(filePath: string, content: string) {
    try {
        const container = await containerPromise;
        const documentParser = container.buildAs<DocumentParser>('documentParse');
        const tokenizer = container.buildAs<TokenFunction>('tokenizer');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

        const documentPath = pathConstructor.buildPath(filePath);
        const projectLocation = {
            documentPath,
            documentDepth: 1,
            documentIndex: 1
        };

        // Complete processing pipeline
        const documentMap = documentParser(content, projectLocation);
        if (!documentMap.success) {
            return { success: false, error: documentMap.message };
        }

        const tokenizedResult = tokenizer(documentMap);
        if (!tokenizedResult.success) {
            return { success: false, error: tokenizedResult.message };
        }

        const tokens = tokenizedResult.value.tokens;

        // Comprehensive token analysis
        const analysis = {
            totalTokens: tokens.length,
            tokenTypes: {
                text: tokens.filter(t => t.type === 'token - text').length,
                atoms: tokens.filter(t => t.type === 'token - atom').length,
                parameters: tokens.filter(t => t.type === 'token - parameter').length,
                closeParens: tokens.filter(t => t.type === 'token - close parenthesis').length
            },
            atomFrequency: {},
            parameterLengths: [],
            locationSpread: {
                minLine: Math.min(...tokens.map(t => t.location.line)),
                maxLine: Math.max(...tokens.map(t => t.location.line)),
                minChar: Math.min(...tokens.map(t => t.location.char)),
                maxChar: Math.max(...tokens.map(t => t.location.char))
            }
        };

        // Analyze atom frequency
        tokens
            .filter(t => t.type === 'token - atom')
            .forEach(t => {
                analysis.atomFrequency[t.text] = (analysis.atomFrequency[t.text] || 0) + 1;
            });

        // Analyze parameter lengths
        analysis.parameterLengths = tokens
            .filter(t => t.type === 'token - parameter')
            .map(t => t.text.length);

        // Validate token structure
        const validationIssues = [];

        // Check for balanced parentheses
        const openParenCount = tokens.filter(t => t.type === 'token - atom').length;
        const closeParenCount = tokens.filter(t => t.type === 'token - close parenthesis').length;
        if (openParenCount !== closeParenCount) {
            validationIssues.push(`Unbalanced parentheses: ${openParenCount} open, ${closeParenCount} close`);
        }

        // Check for orphaned parameters
        const atomsAndParams = tokens.filter(t =>
            t.type === 'token - atom' || t.type === 'token - parameter'
        );
        for (let i = 0; i < atomsAndParams.length - 1; i++) {
            if (atomsAndParams[i].type === 'token - parameter' &&
                atomsAndParams[i + 1].type === 'token - parameter') {
                validationIssues.push(`Consecutive parameters without atom at line ${atomsAndParams[i].location.line}`);
            }
        }

        return {
            success: true,
            analysis,
            validationIssues,
            tokens: tokens.slice(0, 10) // First 10 tokens for inspection
        };

    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

#### When to Use Tokenizer ####

Understanding when and why to use the Tokenizer directly versus through higher-level APIs.

##### Direct Usage Scenarios #####

**1. Syntax Analysis Tools**
- Building Doculisp language servers
- Implementing syntax highlighting
- Creating code completion systems
- Developing linting and validation tools

**2. Custom AST Processing**
- Building alternative AST generators
- Implementing custom semantic analysis
- Creating specialized transformation tools
- Developing debugging utilities

**3. Performance-Critical Applications**
- High-throughput document processing
- Real-time syntax validation
- Incremental parsing systems
- Memory-optimized processing pipelines

**Example - Syntax Validator:**
```typescript
async function validateDoculispSyntax(files: string[]) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const validationResults = [];

    for (const [index, filePath] of files.entries()) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const documentPath = pathConstructor.buildPath(filePath);

            const projectLocation = {
                documentPath,
                documentDepth: 1,
                documentIndex: index + 1
            };

            // Parse and tokenize
            const documentMap = documentParser(content, projectLocation);
            if (!documentMap.success) {
                validationResults.push({
                    file: filePath,
                    stage: 'document-parse',
                    success: false,
                    error: documentMap.message
                });
                continue;
            }

            const tokenizedResult = tokenizer(documentMap);
            if (!tokenizedResult.success) {
                validationResults.push({
                    file: filePath,
                    stage: 'tokenizer',
                    success: false,
                    error: tokenizedResult.message
                });
                continue;
            }

            // Validate token structure
            const tokens = tokenizedResult.value.tokens;
            const issues = validateTokenStructure(tokens);

            validationResults.push({
                file: filePath,
                stage: 'complete',
                success: issues.length === 0,
                tokenCount: tokens.length,
                issues: issues
            });

        } catch (error) {
            validationResults.push({
                file: filePath,
                stage: 'file-access',
                success: false,
                error: error.message
            });
        }
    }

    return validationResults;
}

function validateTokenStructure(tokens: Token[]): string[] {
    const issues = [];

    // Check parentheses balance
    const atomCount = tokens.filter(t => t.type === 'token - atom').length;
    const closeParenCount = tokens.filter(t => t.type === 'token - close parenthesis').length;

    if (atomCount !== closeParenCount) {
        issues.push(`Unbalanced parentheses: ${atomCount} atoms vs ${closeParenCount} close parens`);
    }

    // Check for valid atom/parameter sequences
    const doculispTokens = tokens.filter(t => t.type !== 'token - text');
    for (let i = 0; i < doculispTokens.length - 1; i++) {
        const current = doculispTokens[i];
        const next = doculispTokens[i + 1];

        // Parameters should not follow parameters without atoms
        if (current.type === 'token - parameter' && next.type === 'token - parameter') {
            issues.push(`Invalid parameter sequence at line ${current.location.line}`);
        }
    }

    return issues;
}
```

##### Alternative APIs #####

**High-Level Controller API:**
```typescript
// For standard compilation workflows
const controller = container.buildAs<IController>('controller');
const results = controller.compile(sourcePath, destinationPath);
```

**Complete Pipeline API:**
```typescript
// For full document processing with AST generation
const includeBuilder = container.buildAs<IIncludeBuilder>('includeBuilder');
const astParser = container.buildAs<IAstParser>('astParser');

// DocumentParse → Tokenizer → AstParser → Output
const documentMap = documentParser(content, location);
const tokenized = tokenizer(documentMap);
const ast = astParser.parse(tokenized);
```

**Use Tokenizer directly when:**
- Building syntax analysis tools
- Need access to individual tokens
- Implementing custom AST processing
- Performance optimization required
- Token-level validation needed

**Use higher-level APIs when:**
- Standard document compilation
- Full pipeline processing required
- AST structures needed
- Output generation desired
- Include resolution required

#### Common Error Patterns ####

Understanding common issues and how to resolve them.

##### Input Validation Errors #####

**Failed DocumentParse Input:**
```typescript
// ❌ Passing failed DocumentParse result
const failedDocumentMap = { success: false, message: 'Parse error' };
const result = tokenizer(failedDocumentMap);
// Result: Returns the same failure without processing

// ✅ Validate DocumentParse success first
if (documentMap.success) {
    const tokenized = tokenizer(documentMap);
} else {
    console.error('Document parsing failed:', documentMap.message);
}
```

##### Syntax Errors #####

**Unbalanced Parentheses:**
```typescript
// ❌ Malformed Doculisp - missing closing parenthesis
const badDoculisp = `
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    )
    // Missing closing parenthesis for section-meta
`;

// ✅ Properly balanced parentheses
const goodDoculisp = `
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    )
)
`;
```

**Invalid Escape Sequences:**
```typescript
// ❌ Incorrect escaping
const badEscaping = `(title The \wrong escape)`;
const badBackslash = `(Section C:\Windows\System32)`;  // Unescaped backslashes

// ✅ Proper escaping
const goodEscaping = `(title The \(correct\) escape)`;
const goodBackslash = `(Section C:\\Windows\\System32)`;  // Escaped backslashes
```

##### Location Tracking Issues #####

**Invalid Location Information:**
```typescript
// Location information must be consistent and valid
function validateLocationSequence(tokens: Token[]): boolean {
    for (let i = 0; i < tokens.length - 1; i++) {
        const current = tokens[i].location;
        const next = tokens[i + 1].location;

        // Locations should progress logically
        if (current.line > next.line ||
            (current.line === next.line && current.char >= next.char)) {
            console.warn(`Location inconsistency between tokens ${i} and ${i + 1}`);
            return false;
        }
    }
    return true;
}
```

#### Performance Considerations ####

Best practices for optimal performance when using the Tokenizer.

##### Memory Management #####

**Token Array Optimization:**
```typescript
// For large documents, consider streaming processing
async function processLargeDocument(content: string, chunkSize = 5000) {
    if (content.length <= chunkSize) {
        // Small document - process normally
        return standardTokenization(content);
    }

    // Large document - implement chunked processing
    // Note: This requires careful handling of Doculisp block boundaries
    const chunks = smartChunkDocument(content, chunkSize);
    const allTokens = [];

    for (const chunk of chunks) {
        const chunkTokens = await processChunk(chunk);
        allTokens.push(...chunkTokens);
    }

    return mergeTokenSequences(allTokens);
}
```

**Container Reuse:**
```typescript
// ✅ Reuse container and services for multiple documents
class TokenProcessor {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;

    async initialize() {
        this.container = await containerPromise;
        this.documentParser = this.container.buildAs<DocumentParser>('documentParse');
        this.tokenizer = this.container.buildAs<TokenFunction>('tokenizer');
    }

    async processDocument(content: string, location: IProjectLocation) {
        const documentMap = this.documentParser(content, location);
        return this.tokenizer(documentMap);
    }
}
```

##### Parsing Optimization #####

**Efficient Token Processing:**
```typescript
// Optimize for different content types
function optimizeTokenProcessing(tokens: Token[]): ProcessingStrategy {
    const textTokenCount = tokens.filter(t => t.type === 'token - text').length;
    const doculispTokenCount = tokens.length - textTokenCount;

    if (textTokenCount === 0) {
        return 'pure-doculisp';     // Fastest - no text processing
    } else if (doculispTokenCount === 0) {
        return 'pure-text';        // Simple text passthrough
    } else {
        return 'mixed-content';    // Full processing required
    }
}
```

**Batch Processing Pattern:**
```typescript
async function processBatchTokenization(documents: DocumentInput[]) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');

    // Group by processing complexity
    const grouped = documents.reduce((acc, doc) => {
        const complexity = estimateComplexity(doc.content);
        (acc[complexity] = acc[complexity] || []).push(doc);
        return acc;
    }, {});

    const results = [];

    // Process each complexity group with optimized settings
    for (const [complexity, docs] of Object.entries(grouped)) {
        const batchResults = await processComplexityGroup(
            docs,
            documentParser,
            tokenizer,
            complexity
        );
        results.push(...batchResults);
    }

    return results;
}
```

This comprehensive guide provides everything needed to understand and effectively use the Tokenizer API in Doculisp applications. The Tokenizer serves as a crucial bridge between document parsing and AST generation, providing precise token-level access to Doculisp syntax elements. 😊

## Usage Examples ##

### Basic Compilation Pipeline ###

Here's how to use the container to perform a complete document compilation:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get required services (container is async)
const container = await containerPromise;
const controller = container.buildAs<IController>('controller');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

// Create paths
const sourcePath = pathConstructor.buildPath('./input.dlisp');
const outputPath = pathConstructor.buildPath('./output.md');

// Compile the document
const result = controller.compile(sourcePath, outputPath);

if (result.success) {
    console.log('Compilation successful:', result.value);
} else {
    console.error('Compilation failed:', result.message);
}
```

### Parsing Text Manually ###

To parse Doculisp text without file I/O:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get parsing services (container is async)
const container = await containerPromise;
const tokenizer = container.buildAs<ITokenizer>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
const doculispParser = container.buildAs<IAstDoculispParser>('astDoculispParse');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const sourcePath = pathConstructor.buildPath('./example.md');
const input = '<!-- (dl section-meta This is a test document) -->\n\nHere is test markdown!';

// Step 1: Tokenize
const tokens = tokenizer.tokenize(input, sourcePath);
if (!tokens.success) {
    console.error('Tokenization failed:', tokens.message);
    return;
}

// Step 2: Parse to AST
const ast = astParser.parse(tokens.value, sourcePath);
if (!ast.success) {
    console.error('AST parsing failed:', ast.message);
    return;
}

// Step 3: Parse to Doculisp structures
const doculisp = doculispParser.parse(ast.value, sourcePath);
if (!doculisp.success) {
    console.error('Doculisp parsing failed:', doculisp.message);
    return;
}

console.log('Parsed successfully:', doculisp.value);
```

### Working with Variables ###

The variable table in Doculisp has very limited functionality. It primarily manages:

1. **System-generated string variables**: `source` and `destination` (set automatically)
2. **ID variables**: For tracking header IDs and ensuring uniqueness

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get variable table (container is async)
const container = await containerPromise;
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Check for system variables (automatically set during compilation)
const hasSource = variableTable.hasKey('source');
const hasDestination = variableTable.hasKey('destination');

if (hasSource) {
    const sourceVar = variableTable.getValue<IVariableString>('source');
    if (sourceVar.success) {
        console.log('Source path:', sourceVar.value.value);
    }
}

// The variable table is primarily used internally for ID tracking
// Custom string variables are NOT supported - only system-generated ones
```

### File Operations ###

Working with files through the container:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get file services (container is async)
const container = await containerPromise;
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const filePath = pathConstructor.buildPath('./example.md');

// Check if file exists
const exists = fileHandler.exists(filePath);
if (exists.success && exists.value) {
    // Read file contents
    const content = fileHandler.read(filePath);
    if (content.success) {
        console.log('File content:', content.value);

        // Process and write back
        const processed = content.value.toUpperCase();
        const writeResult = fileHandler.write(filePath, processed);

        if (writeResult.success) {
            console.log('File updated successfully');
        }
    }
}
```

### Document Structure Analysis ###

Analyzing document structure and relationships:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get analysis services (container is async)
const container = await containerPromise;
const structure = container.buildAs<IStructure>('structure');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const projectPath = pathConstructor.buildPath('./project.dlproj');

// Analyze structure
const analysis = structure.analyze(projectPath);
if (analysis.success) {
    console.log('Document structure:', analysis.value);

    // Access individual documents
    analysis.value.documents.forEach(doc => {
        console.log(`Document: ${doc.name}`);
        console.log(`Source: ${doc.sourcePath.fullName}`);
        console.log(`Output: ${doc.outputPath.fullName}`);
    });
}
```

### String Generation ###

Generating markdown output from parsed structures:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get string generation services (container is async)
const container = await containerPromise;
const stringWriter = container.buildAs<IStringWriter>('stringWriter');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume you have a parsed Doculisp structure
const doculispStructure: DoculispPart[] = [
    {
        type: 'header',
        level: 1,
        text: 'Example Header',
        id: 'example-header',
        location: someLocation
    }
];

// Generate markdown
const markdown = stringWriter.write(doculispStructure, variableTable);
if (markdown.success) {
    console.log('Generated markdown:', markdown.value);
}
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