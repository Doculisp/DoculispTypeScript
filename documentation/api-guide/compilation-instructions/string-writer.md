<!-- (dl (section-meta StringWriter API Reference)) -->

<!-- (dl (# StringWriter API Reference)) -->

The **StringWriter** is the **final stage** of the DoculispTypeScript compilation pipeline that converts Doculisp-specific structured data into final markdown output. It transforms the semantic Doculisp structures from AstDoculispParser into properly formatted markdown documents with generated headers, cross-reference resolution, table of contents, and include processing.

<!-- (dl (# Integration Patterns)) -->

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

<!-- (dl (## Overview)) -->

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

<!-- (dl (## Container Registration)) -->

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

<!-- (dl (## Type Definitions)) -->

Understanding the types used by StringWriter is essential for working with markdown generation.

<!-- (dl (### Core Interface)) -->

```typescript
interface IStringWriter {
    writeAst(astMaybe: Result<IDoculisp | IEmptyDoculisp>, variableTable: IVariableTable): Result<string>;
}
```

The `IStringWriter` provides a single `writeAst` method that transforms Doculisp structures into final markdown strings.

<!-- (dl (### Input Types)) -->

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

<!-- (dl (### Output Types)) -->

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

<!-- (dl (## Basic Usage)) -->

<!-- (dl (### Simple Markdown Generation)) -->

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

<!-- (dl (### Handling Empty Documents)) -->

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

<!-- (dl (## Advanced Usage)) -->

<!-- (dl (### Error Handling Patterns)) -->

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

<!-- (dl (### Author Attribution)) -->

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

<!-- (dl (### Cross-Reference Resolution)) -->

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

<!-- (dl (## Markdown Generation Features)) -->

<!-- (dl (### Document Structure Processing)) -->

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

<!-- (dl (### Table of Contents Generation)) -->

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

<!-- (dl (### Include Processing)) -->

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

<!-- (dl (## Integration Patterns)) -->

<!-- (dl (### Pipeline Integration)) -->

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

<!-- (dl (### High-Level Controller Integration)) -->

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

<!-- (dl (## Common Patterns)) -->

<!-- (dl (### Batch Processing)) -->

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

<!-- (dl (### Content Analysis)) -->

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

<!-- (dl (### Custom Formatting)) -->

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

<!-- (dl (## Performance Considerations)) -->

- **Non-singleton**: Each generation gets a fresh StringWriter instance
- **StringBuilder efficiency**: Uses StringBuilder for efficient string construction
- **Memory management**: Processes includes iteratively to manage memory usage
- **Variable table optimization**: Efficient cross-reference lookup through variable table
- **Content ordering**: Maintains proper document order based on location information
- **Spacing algorithms**: Intelligent spacing between different content types

<!-- (dl (## Dependencies)) -->

StringWriter requires these container dependencies:

- **util**: Core utilities for Result types and location handling
- **stringBuilder**: Efficient string construction for markdown assembly

<!-- (dl (## Related Components)) -->

- **AstDoculispParser**: Provides input for StringWriter (IDoculisp structures)
- **StringBuilder**: Used internally for efficient markdown string construction
- **VariableTable**: Provides cross-reference resolution and author information
- **Controller**: High-level API that orchestrates StringWriter with other components
- **FileHandler**: Often consumes StringWriter output for final file writing
- **IncludeBuilder**: Processes includes that StringWriter then merges into final output