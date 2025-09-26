<!-- (dl (section-meta Parsing Pipeline Overview)) -->

Understanding how Doculisp processes different file types is crucial for working with the system effect**Error Message Standards:**
- **Location-aware errors** (`IFailCode`): Include `documentPath`, `line`, `char`, and `type: "code-fail"`
- **General errors** (`IFailGeneral`): Include `type: "general-fail"` and optional `documentPath` but **NO line/char information**
- **Type discrimination**: Use the `type` property to distinguish error categories
- **System-level context**: General errors represent failures outside parsing (file I/O, permissions, etc.)
- Clear description of what failed and why
- Propagate original error context through call stack
- No exceptions thrown - all errors returned as `Result<T>` failuresThis overview explains the three distinct parsing pipelines and how they coordinate to transform source documents into compiled markdown.

<!-- (dl (# Pipeline Architecture)) -->

Doculisp supports three file types, each with its own specialized pipeline optimized for specific use cases:

<!-- (dl (## File Type Overview)) -->

| File Type | Extension | Purpose | Content Rules |
|-----------|-----------|---------|---------------|
| **Project Files** | `.dlproj` | Multi-document coordination | Project structure definitions only |
| **Pure Doculisp** | `.dlisp` | Structure definitions | Doculisp syntax only - no text content |
| **Markdown Files** | `.md` | Mixed content | Text + embedded Doculisp in HTML comments |

<!-- (dl (## Universal Processing Foundation)) -->

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

<!-- (dl (## Pipeline Selection Logic)) -->

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

<!-- (dl (# Working Directory Management)) -->

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

<!-- (dl (# Variable Table Management)) -->

Variable tables follow consistent patterns across all pipelines to manage document context and cross-references:

<!-- (dl (## Core Variables)) -->

- **`' source`** (note leading space): Source file path
- **`' destination`** (note leading space): Output file path
- **Document IDs**: For cross-reference resolution
- **`author`**: Author information for attribution

<!-- (dl (## Table Hierarchy)) -->

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

<!-- (dl (# Include Processing Pattern)) -->

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

<!-- (dl (# Error Handling Standards)) -->

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
- **Location-aware errors** (`IFailCode`): Include `documentPath`, `line`, `char`, and `type: \"code-fail\"`
- **General errors** (`IFailGeneral`): Include `type: \"general-fail\"` and optional `documentPath`
- **Type discrimination**: Use the `type` property to distinguish error categories  
- Clear description of what failed and why
- Propagate original error context through call stack
- No exceptions thrown - all errors returned as `Result<T>` failures

<!-- (dl (# Performance Characteristics)) -->

<!-- (dl (## Pipeline Efficiency)) -->

Each pipeline is optimized for its specific use case:

- **Project files**: Highest overhead (multiple document processing) but efficient for batch operations
- **Doculisp files**: Fastest parsing (no HTML extraction) with moderate include overhead
- **Markdown files**: Moderate parsing overhead (dual extraction) with full feature support

<!-- (dl (## Memory Management)) -->

- Document sections processed sequentially
- Include content loaded on-demand
- Variable tables use copy-on-write for child scopes
- Token streams processed sequentially, not stored entirely in memory

For detailed information about each specific pipeline, see:
- [Project Pipeline Details](./pipeline-details/project-pipeline.md)
- [Doculisp Pipeline Details](./pipeline-details/doculisp-pipeline.md)  
- [Markdown Pipeline Details](./pipeline-details/markdown-pipeline.md)