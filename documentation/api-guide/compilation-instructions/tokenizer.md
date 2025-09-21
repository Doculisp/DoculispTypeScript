<!-- (dl (section-meta Tokenizer API Reference)) -->

The `Tokenizer` component is the second stage in the Doculisp compilation pipeline that converts parsed document content into structured tokens. It takes the output from `DocumentParse` and transforms Doculisp blocks into individual tokens (atoms, parameters, parentheses) while preserving text content and location information.

<!-- (dl (# Overview)) -->

The Tokenizer bridges the gap between raw document parsing and Abstract Syntax Tree (AST) generation. It processes `DocumentMap` structures and creates `TokenizedDocument` outputs that contain discrete tokens representing each element of the Doculisp syntax.

**Primary Responsibilities:**
- Convert Doculisp blocks into individual tokens
- Preserve text content as text tokens
- Handle nested parentheses and comments
- Process escaped characters in parameters
- Maintain precise location tracking for error reporting
- Validate Doculisp syntax at the token level

<!-- (dl (## Container Registration)) -->

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

<!-- (dl (# Type Definitions)) -->

Understanding the types used by the Tokenizer is essential for working with it effectively.

<!-- (dl (## Core Function Type)) -->

```typescript
type TokenFunction = (documentMap: Result<DocumentMap>) => Result<TokenizedDocument>;
```

The `TokenFunction` is a function that takes a parsed document map and returns either a successful `TokenizedDocument` or an error.

<!-- (dl (## Input Types)) -->

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

<!-- (dl (## Output Types)) -->

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

<!-- (dl (# Tokenization Process)) -->

The Tokenizer processes document content through several specialized parsing functions, each handling different types of content.

<!-- (dl (## Token Processing Strategy)) -->

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

<!-- (dl (## Text Token Processing)) -->

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

<!-- (dl (## Doculisp Block Tokenization)) -->

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

<!-- (dl (# Token Types and Examples)) -->

Understanding how different Doculisp constructs become tokens.

<!-- (dl (## Atom Tokens)) -->

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

<!-- (dl (## Parameter Tokens)) -->

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

<!-- (dl (## Parenthesis Tokens)) -->

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

<!-- (dl (## Text Tokens)) -->

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

<!-- (dl (# Usage Examples)) -->

Practical examples showing how to use the Tokenizer in different scenarios.

<!-- (dl (## Basic Usage Pattern)) -->

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

<!-- (dl (## Processing Different Content Types)) -->

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

<!-- (dl (## Advanced Token Analysis)) -->

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

<!-- (dl (# When to Use Tokenizer)) -->

Understanding when and why to use the Tokenizer directly versus through higher-level APIs.

<!-- (dl (## Direct Usage Scenarios)) -->

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

<!-- (dl (## Alternative APIs)) -->

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

<!-- (dl (# Common Error Patterns)) -->

Understanding common issues and how to resolve them.

<!-- (dl (## Input Validation Errors)) -->

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

<!-- (dl (## Syntax Errors)) -->

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

<!-- (dl (## Location Tracking Issues)) -->

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

<!-- (dl (# Performance Considerations)) -->

Best practices for optimal performance when using the Tokenizer.

<!-- (dl (## Memory Management)) -->

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

<!-- (dl (## Parsing Optimization)) -->

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