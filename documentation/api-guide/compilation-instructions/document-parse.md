<!-- (dl (section-meta DocumentParse API Reference)) -->

<!-- (dl (# DocumentParse API Reference)) -->

The **DocumentParse** is the **first stage** of the DoculispTypeScript compilation pipeline that extracts and processes content from text documents. It's responsible for separating text content from embedded Doculisp blocks and preparing them for further processing in the compilation pipeline.

<!-- (dl (# Overview)) -->

`DocumentParse` is the first stage in the Doculisp compilation pipeline that handles raw document text. It determines the file type, applies appropriate parsing strategies, and creates a structured representation of the document content that can be processed by subsequent pipeline stages.

**Primary Responsibilities:**
- Detect file type based on extension (`.md`, `.dlisp`, `.dlproj`)
- Extract Doculisp blocks from HTML comments in markdown files
- Parse pure Doculisp syntax in `.dlisp` files
- Preserve text content alongside extracted structure
- Handle nested code blocks and preserve formatting
- Validate document structure and syntax

<!-- (dl (## Container Registration)) -->

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

<!-- (dl (# Type Definitions)) -->

Understanding the types used by DocumentParse is essential for working with it effectively.

<!-- (dl (## Core Interface)) -->

```typescript
type DocumentParser = (text: string, projectLocation: IProjectLocation) => Result<DocumentMap>;
```

The `DocumentParser` is a function that takes document text and location information, returning either a successful `DocumentMap` or an error.

<!-- (dl (## Input Types)) -->

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

<!-- (dl (## Output Types)) -->

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

<!-- (dl (# Parsing Strategies by File Type)) -->

DocumentParse uses different parsing strategies based on file extension, each optimized for the specific content type and use case.

<!-- (dl (## Markdown Files)) -->

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

<!-- (dl (## Pure Doculisp Files)) -->

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

<!-- (dl (## Project Files)) -->

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

<!-- (dl (# Basic Usage)) -->

Practical examples showing how to use DocumentParse in different scenarios.

<!-- (dl (## Simple Parsing)) -->

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

<!-- (dl (## Processing Different File Types)) -->

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

<!-- (dl (## Advanced Usage with Error Handling)) -->

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

<!-- (dl (# When to Use DocumentParse)) -->

Understanding when and why to use DocumentParse directly versus through higher-level APIs.

<!-- (dl (## Direct Usage Scenarios)) -->

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

<!-- (dl (## Alternative APIs)) -->

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

<!-- (dl (# Common Error Patterns)) -->

Understanding common mistakes and how to avoid them.

<!-- (dl (## Validation Errors)) -->

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

<!-- (dl (## Syntax Errors)) -->

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

<!-- (dl (## Content Type Mismatches)) -->

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

<!-- (dl (# Advanced Usage)) -->

<!-- (dl (## Error Handling Patterns)) -->

Robust error handling for DocumentParse operations:

```typescript
function parseWithErrorHandling(content: string, projectLocation: IProjectLocation): void {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    
    try {
        const result = documentParser(content, projectLocation);
        
        if (!result.success) {
            console.error(`Parse error: ${result.message}`);
            if (result.documentPath) {
                console.error(`At: ${result.documentPath.fullName}`);
            }
            return;
        }
        
        // Process successful result
        if (result.value.parts.length === 0) {
            console.log('Document contains no parseable content');
        } else {
            console.log(`Parsed ${result.value.parts.length} document parts`);
        }
    } catch (error) {
        console.error('Unexpected parsing error:', error);
    }
}
```

<!-- (dl (## Custom Content Processing)) -->

Process document parts with custom logic:

```typescript
function processDocumentParts(documentMap: DocumentMap, processor: (part: DocumentPart) => void): void {
    documentMap.parts.forEach(part => {
        if (part.type === 'text') {
            // Custom text processing
            processor(part);
        } else if (part.type === 'lisp') {
            // Custom Doculisp processing  
            processor(part);
        }
    });
}
```

<!-- (dl (# Integration Patterns)) -->

**DocumentParse** serves as the **first stage** in the parsing pipeline, providing structured input for subsequent stages:

```typescript
async function parseToTokensPipeline(text: string, projectLocation: IProjectLocation): Promise<TokenizedDocument | null> {
    const container = await containerPromise;
    
    // Stage 1: Parse the document structure
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    const documentMap = documentParser(text, projectLocation);
    
    if (!documentMap.success) {
        console.error('Document parsing failed:', documentMap.message);
        return null;
    }
    
    // Stage 2: Tokenize the parsed content
    const tokenizer = container.buildAs<TokenFunction>('tokenizer');
    const tokenizedResult = tokenizer(documentMap);
    
    if (!tokenizedResult.success) {
        console.error('Tokenization failed:', tokenizedResult.message);
        return null;
    }
    
    // Note: Additional pipeline stages exist beyond tokenization
    return tokenizedResult.value;
}
```

<!-- (dl (# Common Patterns)) -->

<!-- (dl (## File Type Detection)) -->

Detect and handle different file types appropriately:

```typescript
function getFileTypeStrategy(filePath: string): 'markdown' | 'doculisp' | 'project' {
    const extension = path.extname(filePath);
    switch (extension) {
        case '.md': return 'markdown';
        case '.dlisp': return 'doculisp';
        case '.dlproj': return 'project';
        default: throw new Error(`Unsupported file type: ${extension}`);
    }
}
```

<!-- (dl (## Batch Processing)) -->

Process multiple documents efficiently:

```typescript
async function processBatch(documents: Array<{content: string, location: IProjectLocation}>) {
    const container = await containerPromise;
    const documentParser = container.buildAs<DocumentParser>('documentParse');
    
    const results = [];
    for (const doc of documents) {
        const result = documentParser(doc.content, doc.location);
        results.push({ ...doc, result });
    }
    
    return results;
}
```

<!-- (dl (# Performance Considerations)) -->

Best practices for optimal performance when using DocumentParse.

<!-- (dl (## Memory Management)) -->

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

<!-- (dl (## Parser Strategy Optimization)) -->

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

This comprehensive guide provides everything needed to understand and effectively use the DocumentParse API in Doculisp applications.

<!-- (dl (# Dependencies)) -->

DocumentParse requires these container dependencies:

- **searches**: Text search utilities for content pattern matching
- **internals**: Internal parsing utilities and array parsers
- **util**: Core utilities for Result types and location handling  
- **trimArray**: Array manipulation utilities for token consumption

<!-- (dl (# Related Components)) -->

- **Tokenizer**: Consumes DocumentParse output (DocumentMap) to create tokens
- **Controller**: High-level API that orchestrates DocumentParse with other components
- **IncludeBuilder**: Uses DocumentParse for processing included files
- **FileHandler**: Provides file I/O services that often precede DocumentParse