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