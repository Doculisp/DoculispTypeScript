<!-- (dl (section-meta Doculisp Pipeline Details)) -->

Pure Doculisp files (`.dlisp`) contain only structure and metadata - no text content allowed. They use the core parsing pipeline with optimizations for pure Doculisp syntax.

<!-- (dl (# Object Chain for Doculisp Files)) -->

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

<!-- (dl (# Unique Characteristics)) -->

**Doculisp-Specific Processing:**
- **Pure Doculisp parsing**: No HTML comment extraction needed
- **Automatic parenthesis wrapping**: `DocumentParse` adds closing parenthesis for proper parsing
- **Structure-only content**: No text content preservation required
- **Optimized parser**: Uses `isDoculisp(true)` parser instead of mixed content parser

<!-- (dl (# Content Preparation)) -->

```typescript
// .dlisp files get wrapped for proper parsing
const isDoculispFile = documentPath.extension === '.dlisp';
const toParse = isDoculispFile ? `${documentText})` : documentText;

// Uses specialized Doculisp parser
const parser = isDoculispFile ?
    createStringParser(isDoculisp(true)) :           // Pure Doculisp
    createStringParser(isMultiline(), isComment());  // Mixed content
```

<!-- (dl (# Processing Advantages)) -->

- **Faster parsing**: No HTML comment extraction overhead
- **Direct Doculisp syntax**: No `dl` wrapper needed
- **Stricter validation**: Structure-only enforcement
- **Clean separation**: Structure vs content concerns separated

<!-- (dl (# Example Doculisp File)) -->

```doculisp
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
```

<!-- (dl (# Usage Pattern)) -->

```typescript
async function compileDoculispFile() {
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const sourcePath = pathConstructor.buildPath('./docs/_main.dlisp');
    const destinationPath = pathConstructor.buildPath('./README.md');
    
    const result = controller.compile(sourcePath, destinationPath);
    
    if (result[0].success) {
        console.log('Doculisp file compiled successfully');
    } else {
        console.error('Compilation failed:', result[0].message);
    }
}
```

<!-- (dl (# Content Rules)) -->

**Allowed Content:**
- Doculisp structure definitions
- Section metadata
- Include declarations
- Dynamic headers
- Content directives

**Prohibited Content:**
- Text content outside Doculisp expressions
- Markdown syntax
- HTML comments
- Static headers (`# ## ###`)

<!-- (dl (# Error Patterns)) -->

**Common Issues:**
- **Text content**: Adding text outside parentheses
- **Unclosed parentheses**: Missing closing parentheses in structure
- **Invalid syntax**: Malformed Doculisp expressions

**Example Error:**
```doculisp
(section-meta
    (title My Document)
    (include
        (Section ./intro.md)
    )
    // Missing closing parenthesis for section-meta
)

This text content is not allowed in .dlisp files!
```

<!-- (dl (# Performance Characteristics)) -->

**Fastest Pipeline:**
- No HTML extraction overhead
- Optimized parser strategy
- Minimal content processing
- Direct syntax validation

**Best For:**
- Structure-only documents
- Configuration files
- Template definitions
- Modular document organization