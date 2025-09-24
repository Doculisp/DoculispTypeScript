<!-- (dl (section-meta Core Objects Reference)) -->

This section provides a comprehensive reference to all objects available in the DoculispTypeScript container system. Objects are organized by functional category to help you understand their roles in the compilation pipeline.

<!-- (dl (# High-Level Controllers)) -->

| Container Key | Interface | Primary Purpose |
|---------------|-----------|-----------------|
| `controller` | `IController` | **Main entry point** - orchestrates entire compilation process |
| `includeBuilder` | `IIncludeBuilder` | **Include coordination** - processes include statements and builds document trees |

**Usage Pattern:**
```typescript
// Most common usage - high-level compilation with full type safety
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IController, IPath, Result } from 'doculisp';

const container = await containerPromise;
const controller = container.buildAs<IController>('controller');
const results: Result<string | false>[] = controller.compile(sourcePath, destinationPath);
```

<!-- (dl (# Core Pipeline Components)) -->

These objects form the heart of the compilation pipeline, processing documents through sequential transformation stages:

| Container Key | Interface | Pipeline Stage | Transforms |
|---------------|-----------|----------------|------------|
| `documentParse` | `IDocumentParser` | **Stage 1** | Raw text → Document parts |
| `tokenizer` | `ITokenizer` | **Stage 2** | Document parts → Tokens |
| `astParser` | `IAstParser` | **Stage 3** | Tokens → Abstract Syntax Tree |
| `astDoculispParse` | `IAstDoculispParser` | **Stage 4** | AST → Doculisp structures |
| `stringWriter` | `IStringWriter` | **Stage 5** | Doculisp structures → Markdown |

**Usage Pattern:**
```typescript
// Direct pipeline access for custom processing with full type safety
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { DocumentParser, TokenFunction, IAstParser } from 'doculisp';

const container = await containerPromise;
const documentParser = container.buildAs<DocumentParser>('documentParse');
const tokenizer = container.buildAs<TokenFunction>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
```

<!-- (dl (# Specialized Parsers)) -->

| Container Key | Interface | Specialized Purpose |
|---------------|-----------|---------------------|
| `astProjectParse` | `IAstProjectParser` | Parses `.dlproj` project configuration files |

<!-- (dl (# File System and I/O)) -->

| Container Key | Interface | Functionality |
|---------------|-----------|---------------|
| `fileHandler` | `IFileWriter` | File operations (read, write, exists), working directory management |
| `pathConstructor` | `IPathConstructor` | Creates and manipulates `IPath` objects, path resolution |

**Usage Pattern:**
```typescript
// File system operations with proper typing
import { containerPromise } from 'doculisp/dist/moduleLoader';
import { IFileWriter, IPathConstructor, IPath, Result } from 'doculisp';

const container = await containerPromise;
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const path: IPath = pathConstructor.buildPath('./docs/readme.md');
const content: Result<string> = fileHandler.load(path);
```

<!-- (dl (# Data and State Management)) -->

| Container Key | Interface | Manages |
|---------------|-----------|---------|
| `variableTable` | `IVariableTable` | System variables (`source`, `destination`), document IDs, cross-references |
| `structure` | `IStructure` | Document structure analysis and relationships |

**Important Variable Limitation:**
The variable table only supports system-generated variables and IDs. Custom string variables are NOT supported.

<!-- (dl (# Output Generation)) -->

| Container Key | Interface | Purpose |
|---------------|-----------|---------|
| `stringWriter` | `IStringWriter` | **Primary output generator** - converts Doculisp structures to markdown |
| `stringBuilder` | `IStringBuilder` | **Utility** - efficient string building with formatting |

<!-- (dl (# Internal Processing Utilities)) -->

| Container Key | Interface | Internal Purpose |
|---------------|-----------|------------------|
| `internals` | `IInternals` | Internal processing utilities and array parsers |
| `util` | `IUtil` | Core utilities including `Result<T>` helpers |
| `utilBuilder` | `IUtilBuilder` | Utility builders and factory methods |
| `textHelpers` | `ITextHelpers` | Text processing and formatting utilities |
| `trimArray` | `ITrimArray` | Array manipulation utilities for token processing |
| `searches` | `ISearches` | Search and lookup utilities for content analysis |

<!-- (dl (# System Information)) -->

| Container Key | Interface | Provides |
|---------------|-----------|----------|
| `version` | `IVersion` | DoculispTypeScript version information |

<!-- (dl (# Object Lifecycle and Dependencies)) -->

**Singleton Behavior:**
Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls
- Efficient resource usage

**Exception:** `stringWriter` is NOT a singleton - new instance created per operation for thread safety.

**Dependency Resolution:**
The container automatically resolves dependencies using these patterns:
- Objects specify their dependencies in registration
- Container builds dependencies before dependent objects
- Circular dependency detection prevents infinite loops
- Lazy loading - objects created only when needed

<!-- (dl (# Key Interface Examples)) -->

<!-- (dl (## IController - Main Entry Point)) -->

```typescript
interface IController {
    compile(sourcePath: IPath, outputPath?: IPath): Result<string>[];
    test(sourcePaths: IPath[]): Result<string>[];
}

// Usage
const controller = container.buildAs<IController>('controller');
const results = controller.compile(sourcePath, destinationPath);
if (results[0].success) {
    console.log('Compilation successful');
}
```

<!-- (dl (## IVariableTable - State Management)) -->

```typescript
interface IVariableTable {
    getValue<T extends IVariable>(key: string): Result<T>;
    hasKey(key: string): boolean;
    createChild(): IVariableTable;
    addValue(key: string, variable: IVariable): void;
    addGlobalValue(key: string, variable: IVariable): void;
}

// Usage - system variables only
const table = container.buildAs<IVariableTable>('variableTable');
const sourceVar = table.getValue(' source'); // Note: leading space required
```

<!-- (dl (## IFileWriter - File Operations)) -->

```typescript
interface IFileWriter {
    load(path: IPath): Result<string>;
    write(path: IPath, content: string): Result<void>;
    exists(path: IPath): Result<boolean>;
    getProcessWorkingDirectory(): Result<IPath>;
    setProcessWorkingDirectory(path: IPath): void;
}

// Usage
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const content = fileHandler.load(filePath);
```

<!-- (dl (## IPathConstructor - Path Management)) -->

```typescript
interface IPathConstructor {
    buildPath(path: string): IPath;
}

// Usage
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');
const docPath = pathConstructor.buildPath('./docs/readme.md');
```

<!-- (dl (# Access Patterns)) -->

**Standard Container Access:**
```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');
const container = await containerPromise;

// Type-safe access (recommended)
const controller = container.buildAs<IController>('controller');

// Untyped access (use sparingly)
const controller = container.build('controller');
```

**Batch Object Creation:**
```typescript
// Efficient when needing multiple objects
const container = await containerPromise;
const [controller, fileHandler, pathConstructor] = [
    container.buildAs<IController>('controller'),
    container.buildAs<IFileWriter>('fileHandler'),
    container.buildAs<IPathConstructor>('pathConstructor')
];
```