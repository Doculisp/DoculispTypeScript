<!-- (dl
    (section-meta Language Server Integration)
) -->

This section provides focused guidance for building language servers that integrate with DoculispTypeScript. It emphasizes the key differences from batch compilation and provides essential patterns.

<!-- (dl (# Key Integration Principles)) -->

Language servers require different patterns than batch compilation:

- **Partial pipeline processing** for different features
- **Position-aware parsing** for cursor-based functionality  
- **Incremental validation** without full compilation
- **Caching and performance** optimization for real-time use

<!-- (dl (# Essential Language Server APIs)) -->

<!-- (dl (## Real-time Validation)) -->

Use [Standard Pipeline Processing](../common-patterns.md#standard-pipeline-processing) with early termination:

```typescript
async function validateSyntax(content: string, uri: string): Promise<ValidationError[]> {
    // See [Standard Container Setup] and [Standard Project Location]
    // Use [Standard Pipeline Processing] but return errors at each stage
    
    const errors: ValidationError[] = [];
    
    // Stop at AST stage for syntax validation - don't need full semantic processing
    if (!astResult.success) {
        errors.push(convertToLanguageServerError(astResult));
    }
    
    return errors; // See [Common Interfaces] for ValidationError
}
```

<!-- (dl (## Position-Based Features)) -->

Extract tokens at cursor positions for IntelliSense:

```typescript
async function getTokensAtPosition(content: string, line: number, char: number, uri: string): Promise<Token[]> {
    // Use [Standard Container Setup] and [Standard Pipeline Processing] to tokenizer stage
    
    return tokenizedResult.value.tokens.filter(token => {
        const tokenEnd = token.location.char + (token.text?.length || 0);
        return token.location.line === line && 
               token.location.char <= char && 
               char <= tokenEnd;
    });
}
```

<!-- (dl (## Completion Provider)) -->

Context-aware completion using pipeline analysis:

```typescript
class DoculispCompletionProvider {
    private readonly CORE_ATOMS = [
        'section-meta', 'title', 'include', 'content', 'toc', 'get-path',
        '#', '##', '###', '####', '#####', '######'
    ];
    
    async getCompletions(content: string, position: Position, uri: string): Promise<CompletionItem[]> {
        // Use [Standard Pipeline Processing] to analyze context
        const context = this.analyzeContext(tokenizedResult.value.tokens, position);
        
        switch (context.type) {
            case 'atom': return this.CORE_ATOMS.map(atom => ({ label: atom, kind: 'Function' }));
            case 'toc-style': return this.getTocStyleCompletions();
            case 'file-path': return this.getFileCompletions(uri);
            default: return [];
        }
    }
    
    // See [Common Interfaces] for CompletionItem
}
```

<!-- (dl (## Document Symbols)) -->

Generate document outline using full semantic analysis:

```typescript
async function getDocumentSymbols(content: string, uri: string): Promise<DocumentSymbol[]> {
    // Use full pipeline including AstDoculispParser for semantic information
    const doculispParser = container.buildAs<IDoculispParser>('astDoculispParse');
    const variableTable = container.buildAs<IVariableTable>('variableTable');
    
    const doculispResult = doculispParser.parse(astResult, variableTable);
    if (!doculispResult.success || doculispResult.value.type === 'doculisp-empty') return [];
    
    return extractSymbols(doculispResult.value); // See [Common Interfaces] for DocumentSymbol
}
```

<!-- (dl (# Performance Patterns)) -->

<!-- (dl (## Container Lifecycle)) -->

For long-running language servers, cache singleton components:

```typescript
class DoculispLanguageServer {
    private sharedComponents: SharedComponents;

    async initialize() {
        const container = await containerPromise;
        
        // Cache singletons for performance
        this.sharedComponents = {
            documentParser: container.buildAs<DocumentParser>('documentParse'),
            tokenizer: container.buildAs<TokenFunction>('tokenizer'),
            astParser: container.buildAs<IAstParser>('astParser'),
            pathConstructor: container.buildAs<IPathConstructor>('pathConstructor')
        };
    }

    // Create fresh instances for non-singletons per request
    createDocumentContext() {
        return {
            doculispParser: this.container.buildAs<IDoculispParser>('astDoculispParse'),
            variableTable: this.container.buildAs<IVariableTable>('variableTable')
        };
    }
}
```

<!-- (dl (## Debounced Validation)) -->

Implement debouncing for real-time feedback:

```typescript
class DebouncedValidator {
    private timeouts = new Map<string, NodeJS.Timeout>();
    private readonly DEBOUNCE_DELAY = 300;

    validateWithDebounce(uri: string, content: string, callback: (errors: ValidationError[]) => void) {
        const existingTimeout = this.timeouts.get(uri);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(async () => {
            const errors = await validateSyntax(content, uri); // See above
            callback(errors);
            this.timeouts.delete(uri);
        }, this.DEBOUNCE_DELAY);

        this.timeouts.set(uri, timeout);
    }
}
```

<!-- (dl (# Advanced Integration)) -->

<!-- (dl (## Working Directory Management)) -->

Handle include resolution correctly:

```typescript
async function processWithWorkingDirectory<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
    const fileHandler = container.buildAs<IFileWriter>('fileHandler');
    const path = pathConstructor.buildPath(filePath);
    
    const originalDir = fileHandler.getProcessWorkingDirectory();
    const targetDir = path.getContainingDir();

    try {
        fileHandler.setProcessWorkingDirectory(targetDir);
        return await operation();
    } finally {
        if (originalDir.success) {
            fileHandler.setProcessWorkingDirectory(originalDir.value);
        }
    }
}
```

For complete implementation examples, see:
- **Core Pipeline APIs**: Position-aware parsing details
- **Usage Patterns**: Full class implementations  
- **Common Patterns**: Reusable code blocks and interfaces