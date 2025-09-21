<!-- (dl (section-meta Architecture Overview)) -->

<!-- (dl (# System Architecture)) -->

The DoculispTypeScript compilation system follows a **pipeline architecture** where each stage transforms input through specialized processing components. Understanding this architecture is essential for effective use of the API.

<!-- (dl (## Pipeline Overview)) -->

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

<!-- (dl (## File Type Routing)) -->

The controller automatically selects processing pipelines based on file extension:

| Extension | Pipeline | Purpose |
|-----------|----------|---------|
| `.dlproj` | Project Pipeline | Multi-document batch processing |
| `.dlisp` | Pure Doculisp Pipeline | Structure-only documents |
| `.md` | Markdown Pipeline | Mixed content with embedded Doculisp |

<!-- (dl (## Core Processing Components)) -->

<!-- (dl (### Universal Components)) -->

These components are shared across all pipelines:

- **Controller**: Entry point and orchestration
- **FileHandler**: File I/O and working directory management
- **VariableTable**: System variables and ID tracking
- **IncludeBuilder**: Recursive include processing

<!-- (dl (### Pipeline-Specific Components)) -->

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

<!-- (dl (## Variable Management)) -->

The system maintains consistent variable tables across all processing:

<!-- (dl (### System Variables)) -->

- **`' source`** (note leading space): Source file path
- **`' destination`** (note leading space): Output file path  
- **Document IDs**: For cross-reference resolution
- **`author`**: Author information for attribution

<!-- (dl (### Variable Scope Hierarchy)) -->

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

<!-- (dl (## Include Processing)) -->

Include processing follows a recursive pattern that maintains context:

<!-- (dl (### Working Directory Management)) -->

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

<!-- (dl (### Include Validation)) -->

Include processing enforces strict rules:
- Only `.md` and `.dlisp` files can be included
- Circular dependencies are detected and prevented
- Include depth is tracked for proper nesting
- Relative paths resolved from including file's directory

<!-- (dl (## Error Handling Strategy)) -->

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

<!-- (dl (## Output Generation)) -->

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

<!-- (dl (## Performance Characteristics)) -->

<!-- (dl (### Pipeline Efficiency)) -->

- **Project files**: Highest overhead (multiple document processing) but efficient for batch operations
- **Doculisp files**: Fastest parsing (no HTML extraction) with moderate include overhead
- **Markdown files**: Moderate parsing overhead (dual extraction) with full feature support

<!-- (dl (### Memory Management)) -->

- All pipelines use streaming processing to minimize memory footprint
- Include processing loads files on-demand rather than pre-loading
- Variable tables use copy-on-write for efficient child scope management
- Most container objects are singletons - created once and reused