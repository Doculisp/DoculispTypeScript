<!-- (dl (section-meta Parsing Pipeline Chains)) -->

Understanding how Doculisp processes different file types is crucial for working with the container system effectively. This section provides comprehensive documentation of the three distinct parsing pipelines and their object chains.

<!-- (dl (# Overview of File Types)) -->

Doculisp supports three primary file types, each with its own specialized parsing pipeline:

1. **`.dlproj` Project Files** - Define multi-document projects with source/output mappings
2. **`.dlisp` Pure Doculisp Files** - Contain only Doculisp structure and metadata  
3. **`.md` Markdown Files** - Standard markdown with embedded Doculisp blocks in HTML comments

Each file type follows a different object chain through the container system, optimized for its specific purpose and content structure.

<!-- (dl (# Core Parsing Components)) -->

Before examining the specific pipelines, it's important to understand the common processing components that all file types share. These form the foundation of Doculisp's parsing architecture.

<!-- (dl (## Universal Parsing Steps)) -->

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

<!-- (dl (## File Extension Detection and Routing)) -->

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

<!-- (dl (## Working Directory Management)) -->

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

<!-- (dl (## Variable Table Setup and Lifecycle)) -->

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

<!-- (dl (## Include Processing Pattern)) -->

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

<!-- (dl (## Error Handling Patterns)) -->

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

<!-- (dl (# Project File Pipeline for dlproj Files)) -->

Project files define collections of documents and are processed through a specialized pipeline that handles project-level orchestration. Unlike individual document files, project files manage multiple source/output mappings and coordinate batch processing.

<!-- (dl (## Object Chain for dlproj Files)) -->

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

<!-- (dl (## Project-Specific Processing)) -->

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

<!-- (dl (# Pure Doculisp File Pipeline for dlisp Files)) -->

Pure Doculisp files contain only structure and metadata - no text content allowed. They use the core parsing pipeline with optimizations for pure Doculisp syntax.

<!-- (dl (## Object Chain for dlisp Files)) -->

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

<!-- (dl (## Doculisp-Specific Processing)) -->

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

<!-- (dl (# Markdown File Pipeline for md Files)) -->

Markdown files contain text content with embedded Doculisp blocks in HTML comments. This pipeline handles dual content extraction and processing.

<!-- (dl (## Object Chain for md Files)) -->

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

<!-- (dl (## Markdown-Specific Processing)) -->

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

<!-- (dl (# Document Output Generation)) -->

After parsing is complete, all pipelines converge on a common output generation process that transforms the parsed Doculisp structures into final markdown documents.

<!-- (dl (## Output Pipeline Architecture)) -->

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

<!-- (dl (## StringWriter Processing)) -->

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

<!-- (dl (## Output Generation Flow)) -->

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

<!-- (dl (## Output Formatting and Structure)) -->

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

<!-- (dl (## Cross-Reference Resolution)) -->

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

<!-- (dl (## Variable Table in Output)) -->

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

<!-- (dl (## Error Handling in Output)) -->

Output generation includes comprehensive error handling:

**Validation Errors**
- Missing variable references → Detailed error with location
- Invalid cross-references → Error with ID and document location
- File write failures → File system error propagation

**Recovery Strategies**
- Invalid IDs return empty strings rather than failing entire compilation
- Missing includes skip gracefully with warnings
- File write errors halt compilation with clear error messages

<!-- (dl (## Performance Considerations)) -->

**Output Optimization**
- `StringBuilder` uses efficient string concatenation
- Minimal string copying during generation process
- Lazy evaluation of cross-references
- Streaming output for large documents

**Memory Management**
- Document sections processed sequentially
- Include content loaded on-demand
- Variable tables use copy-on-write for child scopes

<!-- (dl (# Pipeline Comparison and Selection)) -->

Now that we've covered the core components and individual pipelines, let's examine how they compare and when each is used.

<!-- (dl (## Pipeline Selection Logic)) -->

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

<!-- (dl (## Pipeline Comparison)) -->

| Aspect | .dlproj Files | .dlisp Files | .md Files |
|--------|---------------|--------------|-----------|
| **Primary Purpose** | Multi-document coordination | Pure structure definition | Mixed content documents |
| **Content Type** | Project definitions | Doculisp structure only | Text + embedded Doculisp |
| **Parser Strategy** | Project structure extraction | Pure Doculisp parsing | Dual content extraction |
| **Include Support** | Via individual documents | Direct recursive includes | Direct recursive includes |
| **Output** | Multiple files (batch) | Single file | Single file |
| **Destination** | Embedded in project | Required parameter | Required parameter |
| **Text Content** | Not applicable | Not allowed | Fully supported |

<!-- (dl (## Performance Characteristics)) -->

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

<!-- (dl (# Performance and Memory Considerations)) -->

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

<!-- (dl (# Debugging and Troubleshooting)) -->

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

<!-- (dl (# Extension Points)) -->

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