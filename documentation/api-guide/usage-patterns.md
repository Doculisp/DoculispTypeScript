<!-- (dl (section-meta Usage Patterns and Examples)) -->

This section provides practical examples and common usage patterns for the DoculispTypeScript API, organized by use case and complexity level.

<!-- (dl (# Quick Start Examples)) -->

<!-- (dl (## Basic Document Compilation)) -->

```typescript
import { containerPromise } from 'doculisp/dist/moduleLoader';

async function compileDocument() {
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