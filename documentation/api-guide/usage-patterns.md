<!-- (dl (section-meta Usage Patterns and Examples)) -->

This section provides practical examples and common usage patterns for the DoculispTypeScript API, organized by use case and complexity level.

**Note:** All examples use standard setup patterns. See [Common Patterns](common-patterns.md) for reusable code blocks including container setup, project location creation, and pipeline processing.

<!-- (dl (# Quick Start Examples)) -->

<!-- (dl (## Basic Document Compilation)) -->

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';

async function compileDocument() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Compile a single document
    const sourcePath = pathConstructor.buildPath('./docs/_main.dlisp');
    const destinationPath = pathConstructor.buildPath('./README.md');
    
    const results = controller.compile(sourcePath, destinationPath);
    
    if (results[0].success) {
        console.log('✅ Document compiled successfully');
        console.log('📄 Output:', results[0].value);
    } else {
        console.error('❌ Compilation failed:', results[0].message);
    }
}
```

<!-- (dl (## Project Batch Compilation)) -->

```typescript
async function compileProject() {
    // Use [Standard Container Setup] - see common-patterns.md
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    // Compile entire project (multiple documents)
    const projectPath = pathConstructor.buildPath('./docs/docs.dlproj');
    
    // Project files don't need destination - it's embedded in structure
    const results = controller.compile(projectPath);
    
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

<!-- (dl (# Language Server Examples)) -->

<!-- (dl (## Real-time Validation)) -->

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';

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
        const projectLocation = {
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

<!-- (dl (## Syntax Highlighting Support)) -->

```typescript
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
        const projectLocation = {
            documentPath: this.pathConstructor.buildPath(uri),
            documentDepth: 1,
            documentIndex: 1
        };

        const documentMap = this.documentParser(content, projectLocation);
        if (!documentMap.success) return [];

        const tokenizedResult = this.tokenizer(documentMap);
        if (!tokenizedResult.success) return [];

        return tokenizedResult.value.tokens.map(token => ({
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

<!-- (dl (## IntelliSense Provider)) -->

```typescript
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
        const projectLocation = {
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

<!-- (dl (## Document Symbol Provider)) -->

```typescript
class DoculispSymbolProvider {
    private container: any;
    private documentParser: DocumentParser;
    private tokenizer: TokenFunction;
    private astParser: IAstParser;
    private doculispParser: IDoculispParser;
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

        const projectLocation = {
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

<!-- (dl (# Pipeline Processing Examples)) -->

<!-- (dl (## Step-by-Step Pipeline Processing)) -->

```typescript
async function processDocumentPipeline(filePath: string, content: string) {
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

<!-- (dl (## Content Analysis)) -->

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

<!-- (dl (# Advanced Usage Patterns)) -->

<!-- (dl (## Custom Container Integration)) -->

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

<!-- (dl (## Error Handling Patterns)) -->

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

<!-- (dl (## Testing Patterns)) -->

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

<!-- (dl (# Performance Optimization)) -->

<!-- (dl (## Batch Processing Optimization)) -->

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

<!-- (dl (## Container Optimization)) -->

```typescript
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

    async compileFile(sourcePath: string, destinationPath?: string) {
        // Reuse container instances for better performance
        const source = this.pathConstructor.buildPath(sourcePath);
        const destination = destinationPath ? 
            this.pathConstructor.buildPath(destinationPath) : undefined;

        return this.controller.compile(source, destination);
    }

    async compileMultiple(files: Array<{source: string, destination?: string}>) {
        const results = [];
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