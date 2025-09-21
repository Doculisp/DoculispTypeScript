<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->
<!-- Written By: GitHub Copilot -->

# DoculispTypeScript API Guide #

### Understanding the Dependency Injection Container and Core Objects ###

## Contents ##

* [Introduction](#introduction)
* [Container Basics](#container-basics)
* [Core Objects Reference](#core-objects-reference)
* [Usage Examples](#usage-examples)
* [Testing Patterns](#testing-patterns)
* [Advanced Usage](#advanced-usage)

## Introduction ##

The DoculispTypeScript project uses a custom **Dependency Injection (DI) Container** to manage object creation, dependencies, and lifecycle. This guide provides comprehensive information about how to work with the container system and understand the core objects available in the compilation pipeline.

### Why Dependency Injection? ###

The DI container provides several key benefits:

- **Testability**: Easy mocking and replacement of dependencies during testing
- **Modularity**: Clean separation of concerns and loose coupling
- **Lifecycle Management**: Automatic singleton management and dependency resolution
- **Circular Dependency Detection**: Built-in protection against dependency cycles

### Container Architecture ###

The container system consists of several interfaces:

- `IContainer`: Main interface combining dependency management and registration
- `IDependencyManager`: Building and retrieving objects
- `IDependencyContainer`: Registering new modules
- `ITestableContainer`: Testing-specific features like dependency replacement

### Getting Started ###

The container is automatically populated with all available modules when the application starts. You can access it through:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Build any registered object (container is async)
const container = await containerPromise;
const parser = container.buildAs<ITokenizer>('tokenizer');
```

**Important**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing the container.

The container automatically resolves all dependencies and ensures proper initialization order.

### TypeScript Types ###

When using TypeScript, you can import types from the package:

```typescript
// Import common interface types
import type {
    IController,
    ITokenizer,
    IAstParser,
    IPathConstructor,
    IVariableTable,
    IFileWriter,
    Result
} from 'doculisp/dist/types/types.general';

// Import specific type files as needed
import type { IStringWriter } from 'doculisp/dist/types/types.stringWriter';
import type { IStructure } from 'doculisp/dist/types/types.structure';
```

The main types are organized across several type definition files in the `doculisp/dist/types/` directory.

### Important Note About Variables ###

The Doculisp compiler has very limited variable support. The variable table only supports:

- **System-generated string variables**: `source` and `destination` (automatically set during compilation)
- **ID variables**: Used internally for tracking header IDs and ensuring uniqueness

**Custom string variables are NOT supported** - you cannot add arbitrary string variables for use in documents.

## Container Basics ##

### Building Objects ###

The primary way to get objects from the container is using the `build` methods:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Build with automatic type inference (container is async)
const container = await containerPromise;
const tokenizer = container.build('tokenizer');

// Build with explicit typing (recommended)
const parser = container.buildAs<IAstParser>('astParser');
```

### Registration Patterns ###

Objects are registered automatically by the module loader, but you can also register manually:

#### Registering Values ####

```typescript
// Get the container first (container is async)
const container = await containerPromise;

// Register a simple value
container.registerValue(myConfig, 'config');

// Register an object with a name property
const logger = { name: 'logger', log: (msg: string) => console.log(msg) };
container.registerValue(logger);
```

#### Registering Builders ####

```typescript
// Get the container first (container is async)
const container = await containerPromise;

// Register a builder function
container.registerBuilder(
    (dep1: IDep1, dep2: IDep2) => new MyService(dep1, dep2),
    ['dependency1', 'dependency2'],
    'myService',
    true // singleton
);
```

#### Registration Interface ####

All registered modules implement the `IRegisterable` interface:

```typescript
interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}
```

### Error Handling ###

The container throws errors for missing modules rather than returning error objects:

```typescript
try {
    const result = container.build('nonExistentModule');
    // Use result directly - it's the actual object, not a Result<T>
} catch (error) {
    console.error('Module not found:', error.message);
}
```

**Note**: Unlike other parts of the Doculisp system that use `Result<T>` patterns, the container throws errors for missing modules or circular dependencies.

### Circular Dependencies ###

The container automatically detects circular dependencies and throws descriptive errors:

```
Error: Circular dependencies between ("moduleA" => "moduleB" => "moduleA")
```

## Core Objects Reference ##

### Parser Pipeline Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `tokenizer` | `ITokenizer` | Converts raw text into tokens (atoms, parentheses, parameters) |
| `astParser` | `IAstParser` | Builds Abstract Syntax Tree from tokens |
| `astDoculispParse` | `IAstDoculispParser` | Converts AST to Doculisp semantic structures |
| `astProjectParse` | `IAstProjectParser` | Parses `.dlproj` project files |
| `documentParse` | `IDocumentParser` | Extracts Doculisp blocks from markdown documents |

### Output Generation Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `stringWriter` | `IStringWriter` | Generates final markdown output from parsed structures |
| `stringBuilder` | `IStringBuilder` | Utility for building strings with proper formatting |

### File and Path Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `fileHandler` | `IFileWriter` | File system operations (read, write, exists) |
| `pathConstructor` | `IPathConstructor` | Creates and manipulates `IPath` objects |

### Data Management Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `variableTable` | `IVariableTable` | Manages system variables (`source`, `destination`) and ID tracking |
| `includeBuilder` | `IIncludeBuilder` | Processes include statements and builds document trees |
| `structure` | `IStructure` | Analyzes document structure and relationships |

### Control and Orchestration Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `controller` | `IController` | Main compilation controller with compile/test methods |
| `internals` | `IInternals` | Internal processing utilities and helpers |

### Utility Objects ###

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `util` | `IUtil` | General utilities including Result<T> helpers |
| `utilBuilder` | `IUtilBuilder` | Utility builders and factory methods |
| `textHelpers` | `ITextHelpers` | Text processing and formatting utilities |
| `trimArray` | `ITrimArray` | Array manipulation utilities |
| `searches` | `ISearches` | Search and lookup utilities |
| `version` | `IVersion` | Version information and management |

### Object Lifecycle ###

Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls

### Key Interface Examples ###

#### ITokenizer ####

```typescript
interface ITokenizer {
    tokenize(input: string, path: IPath): Result<Token[]>;
}
```

#### IVariableTable ####

```typescript
interface IVariableTable {
    getValue<T extends IVariable>(key: string): Result<T>;
    hasKey(key: string): boolean;
    // Note: Limited functionality - primarily for system variables and ID tracking
    // Only supports system-generated string variables: 'source' and 'destination'
    // Custom string variables are NOT supported
}
```

#### IController ####

```typescript
interface IController {
    compile(sourcePath: IPath, outputPath?: IPath): Result<string>;
    test(sourcePaths: IPath[]): Result<string>[];
}
```

## Usage Examples ##

### Basic Compilation Pipeline ###

Here's how to use the container to perform a complete document compilation:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get required services (container is async)
const container = await containerPromise;
const controller = container.buildAs<IController>('controller');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

// Create paths
const sourcePath = pathConstructor.buildPath('./input.dlisp');
const outputPath = pathConstructor.buildPath('./output.md');

// Compile the document
const result = controller.compile(sourcePath, outputPath);

if (result.success) {
    console.log('Compilation successful:', result.value);
} else {
    console.error('Compilation failed:', result.message);
}
```

### Parsing Text Manually ###

To parse Doculisp text without file I/O:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get parsing services (container is async)
const container = await containerPromise;
const tokenizer = container.buildAs<ITokenizer>('tokenizer');
const astParser = container.buildAs<IAstParser>('astParser');
const doculispParser = container.buildAs<IAstDoculispParser>('astDoculispParse');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const sourcePath = pathConstructor.buildPath('./example.md');
const input = '<!-- (dl section-meta This is a test document) -->\n\nHere is test markdown!';

// Step 1: Tokenize
const tokens = tokenizer.tokenize(input, sourcePath);
if (!tokens.success) {
    console.error('Tokenization failed:', tokens.message);
    return;
}

// Step 2: Parse to AST
const ast = astParser.parse(tokens.value, sourcePath);
if (!ast.success) {
    console.error('AST parsing failed:', ast.message);
    return;
}

// Step 3: Parse to Doculisp structures
const doculisp = doculispParser.parse(ast.value, sourcePath);
if (!doculisp.success) {
    console.error('Doculisp parsing failed:', doculisp.message);
    return;
}

console.log('Parsed successfully:', doculisp.value);
```

### Working with Variables ###

The variable table in Doculisp has very limited functionality. It primarily manages:

1. **System-generated string variables**: `source` and `destination` (set automatically)
2. **ID variables**: For tracking header IDs and ensuring uniqueness

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get variable table (container is async)
const container = await containerPromise;
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Check for system variables (automatically set during compilation)
const hasSource = variableTable.hasKey('source');
const hasDestination = variableTable.hasKey('destination');

if (hasSource) {
    const sourceVar = variableTable.getValue<IVariableString>('source');
    if (sourceVar.success) {
        console.log('Source path:', sourceVar.value.value);
    }
}

// The variable table is primarily used internally for ID tracking
// Custom string variables are NOT supported - only system-generated ones
```

### File Operations ###

Working with files through the container:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get file services (container is async)
const container = await containerPromise;
const fileHandler = container.buildAs<IFileWriter>('fileHandler');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const filePath = pathConstructor.buildPath('./example.md');

// Check if file exists
const exists = fileHandler.exists(filePath);
if (exists.success && exists.value) {
    // Read file contents
    const content = fileHandler.read(filePath);
    if (content.success) {
        console.log('File content:', content.value);

        // Process and write back
        const processed = content.value.toUpperCase();
        const writeResult = fileHandler.write(filePath, processed);

        if (writeResult.success) {
            console.log('File updated successfully');
        }
    }
}
```

### Document Structure Analysis ###

Analyzing document structure and relationships:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get analysis services (container is async)
const container = await containerPromise;
const structure = container.buildAs<IStructure>('structure');
const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

const projectPath = pathConstructor.buildPath('./project.dlproj');

// Analyze structure
const analysis = structure.analyze(projectPath);
if (analysis.success) {
    console.log('Document structure:', analysis.value);

    // Access individual documents
    analysis.value.documents.forEach(doc => {
        console.log(`Document: ${doc.name}`);
        console.log(`Source: ${doc.sourcePath.fullName}`);
        console.log(`Output: ${doc.outputPath.fullName}`);
    });
}
```

### String Generation ###

Generating markdown output from parsed structures:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Get string generation services (container is async)
const container = await containerPromise;
const stringWriter = container.buildAs<IStringWriter>('stringWriter');
const variableTable = container.buildAs<IVariableTable>('variableTable');

// Assume you have a parsed Doculisp structure
const doculispStructure: DoculispPart[] = [
    {
        type: 'header',
        level: 1,
        text: 'Example Header',
        id: 'example-header',
        location: someLocation
    }
];

// Generate markdown
const markdown = stringWriter.write(doculispStructure, variableTable);
if (markdown.success) {
    console.log('Generated markdown:', markdown.value);
}
```

## Testing Patterns ##

### Creating Testable Containers ###

The container system provides excellent support for testing through dependency replacement:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

describe('My Service Tests', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Create a testable container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
    });

    afterEach(() => {
        // Clean up replacements
        testContainer.restoreAll();
    });

    it('should handle file operations', () => {
        // Mock the file handler
        const mockFileHandler = {
            read: jest.fn().mockReturnValue({ success: true, value: 'test content' }),
            write: jest.fn().mockReturnValue({ success: true, value: true }),
            exists: jest.fn().mockReturnValue({ success: true, value: true })
        };

        // Replace the file handler in the container
        testContainer.replaceValue(mockFileHandler, 'fileHandler');

        // Build your service that depends on fileHandler
        const myService = testContainer.buildAs<IMyService>('myService');

        // Test the service
        const result = myService.doSomething();

        expect(mockFileHandler.read).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });
});
```

### Mocking Dependencies ###

#### Simple Value Replacement ####

```typescript
// Replace with a simple mock object
const mockUtil = {
    ok: (value: any) => ({ success: true, value }),
    fail: (message: string) => ({ success: false, message })
};

testContainer.replaceValue(mockUtil, 'util');
```

#### Builder Function Replacement ####

```typescript
// Replace with a builder function
testContainer.replaceBuilder(
    (dependency: IDependency) => new MockService(dependency),
    ['mockDependency'],
    'originalService'
);
```

### Testing Parser Pipeline ###

Testing the complete parsing pipeline:

```typescript
describe('Parser Pipeline', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();

        // Mock file operations for consistent testing
        const mockFileHandler = {
            read: jest.fn(),
            write: jest.fn(),
            exists: jest.fn()
        };

        testContainer.replaceValue(mockFileHandler, 'fileHandler');
    });

    it('should parse doculisp correctly', () => {
        const tokenizer = testContainer.buildAs<ITokenizer>('tokenizer');
        const astParser = testContainer.buildAs<IAstParser>('astParser');
        const doculispParser = testContainer.buildAs<IAstDoculispParser>('astDoculispParse');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');

        const input = '(#intro Introduction)\n\nContent here.';
        const path = pathConstructor.buildPath('./test.dlisp');

        // Test each stage
        const tokens = tokenizer.tokenize(input, path);
        expect(tokens.success).toBe(true);

        const ast = astParser.parse(tokens.value, path);
        expect(ast.success).toBe(true);

        const doculisp = doculispParser.parse(ast.value, path);
        expect(doculisp.success).toBe(true);
        expect(doculisp.value).toHaveLength(2); // Header + content
    });
});
```

### Variable Table Testing ###

Testing variable management (limited to system variables and IDs):

```typescript
describe('Variable Table', () => {
    let testContainer: ITestableContainer;
    let variableTable: IVariableTable;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
        variableTable = testContainer.buildAs<IVariableTable>('variableTable');
    });

    it('should provide access to system variables', () => {
        // Note: Variable table primarily used for system variables like 'source', 'destination'
        // and ID tracking. Custom string variables are not supported.

        // Test checking for system variables
        const hasSource = variableTable.hasKey('source');
        const hasDestination = variableTable.hasKey('destination');

        // System variables may or may not be present depending on compilation context
        expect(typeof hasSource).toBe('boolean');
        expect(typeof hasDestination).toBe('boolean');
    });

    it('should handle ID variable queries', () => {
        // The variable table is primarily used for ID tracking during compilation
        const hasTestId = variableTable.hasKey('some-header-id');
        expect(typeof hasTestId).toBe('boolean');
    });
});
```

### Error Scenario Testing ###

Testing error conditions and edge cases:

```typescript
describe('Error Handling', () => {
    let testContainer: ITestableContainer;

    beforeEach(async () => {
        // Get container (container is async)
        const container = await containerPromise;
        testContainer = container.buildTestable();
    });

    it('should handle missing files gracefully', () => {
        // Mock file handler to simulate missing file
        const mockFileHandler = {
            exists: jest.fn().mockReturnValue({ success: true, value: false }),
            read: jest.fn().mockReturnValue({
                success: false,
                message: 'File not found'
            })
        };

        testContainer.replaceValue(mockFileHandler, 'fileHandler');

        const controller = testContainer.buildAs<IController>('controller');
        const pathConstructor = testContainer.buildAs<IPathConstructor>('pathConstructor');

        const sourcePath = pathConstructor.buildPath('./nonexistent.dlisp');
        const result = controller.compile(sourcePath);

        expect(result.success).toBe(false);
        expect(result.message).toContain('File not found');
    });

    it('should handle circular dependencies', () => {
        // This test would involve creating modules with circular deps
        // and verifying the container throws appropriate errors
        expect(() => {
            testContainer.registerBuilder(
                (dep: any) => dep,
                ['circularDep'],
                'circularDep'
            );
            testContainer.build('circularDep');
        }).toThrow(/Circular dependencies/);
    });
});
```

### Integration Testing ###

Testing complete workflows:

```typescript
describe('Integration Tests', () => {
    it('should compile a complete document', async () => {
        // Use the real container for integration tests (container is async)
        const container = await containerPromise;
        const controller = container.buildAs<IController>('controller');
        const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

        // Test with a known good file
        const sourcePath = pathConstructor.buildPath('./test-fixtures/sample.dlisp');
        const outputPath = pathConstructor.buildPath('./test-output/result.md');

        const result = controller.compile(sourcePath, outputPath);

        expect(result.success).toBe(true);

        // Verify output file was created and has expected content
        const fileHandler = container.buildAs<IFileWriter>('fileHandler');
        const outputExists = fileHandler.exists(outputPath);
        expect(outputExists.success).toBe(true);
        expect(outputExists.value).toBe(true);
    });
});
```

## Advanced Usage ##

### Custom Module Registration ###

You can extend the container by registering your own modules:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Define your custom service
interface ICustomProcessor {
    process(input: string): Result<string>;
}

class CustomProcessor implements ICustomProcessor {
    constructor(
        private textHelpers: ITextHelpers,
        private util: IUtil
    ) {}

    process(input: string): Result<string> {
        try {
            const processed = this.textHelpers.format(input);
            return this.util.ok(processed);
        } catch (error) {
            return this.util.fail(`Processing failed: ${error.message}`);
        }
    }
}

// Register the custom service (container is async)
const container = await containerPromise;
container.registerBuilder(
    (textHelpers: ITextHelpers, util: IUtil) => new CustomProcessor(textHelpers, util),
    ['textHelpers', 'util'],
    'customProcessor',
    true // singleton
);

// Use the custom service
const processor = container.buildAs<ICustomProcessor>('customProcessor');
```

### Container Lifecycle Management ###

#### Manual Module Loading ####

For advanced scenarios, you can manually control module loading:

```typescript
// Note: Creating custom containers requires direct access to internal classes
// This is an advanced use case - most users should use the default container
const { Container } = require('doculisp/dist/container');

// Create a new container instance
const customContainer = new Container();

// Register specific modules only
customContainer.registerValue(console, 'logger');
customContainer.registerBuilder(
    (logger: Console) => ({
        log: (msg: string) => logger.log(`[CUSTOM] ${msg}`)
    }),
    ['logger'],
    'customLogger'
);

const logger = customContainer.buildAs<{ log: (msg: string) => void }>('customLogger');
logger.log('Hello from custom container!');
```

### Performance Considerations ###

#### Singleton Strategy ####

Most objects should be singletons for performance:

```typescript
// Good: Singleton registration (container is async)
const container = await containerPromise;
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    true // singleton = true
);

// Avoid: Non-singleton for expensive objects
container.registerBuilder(
    (dep1: IDep1) => new ExpensiveService(dep1),
    ['dependency1'],
    'expensiveService',
    false // Creates new instance every time
);
```

#### Lazy Loading ####

The container supports lazy loading - objects are only created when first requested:

```typescript
// This registration doesn't create the object yet (container is async)
const container = await containerPromise;
container.registerBuilder(
    () => new HeavyObject(),
    [],
    'heavyObject',
    true
);

// Object is created here on first build()
const heavy = container.buildAs<HeavyObject>('heavyObject');

// Subsequent calls return the same instance
const same = container.buildAs<HeavyObject>('heavyObject');
console.log(heavy === same); // true
```

### Error Recovery and Fallbacks ###

#### Graceful Degradation ####

```typescript
interface IOptionalService {
    isAvailable(): boolean;
    doWork(): Result<string>;
}

class OptionalServiceImpl implements IOptionalService {
    private available: boolean;

    constructor(dependency?: IDependency) {
        this.available = !!dependency;
    }

    isAvailable(): boolean {
        return this.available;
    }

    doWork(): Result<string> {
        if (!this.available) {
            return { success: false, message: 'Service not available' };
        }
        // Do actual work
        return { success: true, value: 'Work completed' };
    }
}

// Register with optional dependency (container is async)
const container = await containerPromise;
container.registerBuilder(
    (optionalDep?: IDependency) => new OptionalServiceImpl(optionalDep),
    [], // No required dependencies
    'optionalService'
);
```

### Container Inspection ###

#### Debugging and Monitoring ####

```typescript
// Get list of all registered modules (container is async)
const container = await containerPromise;
const modules = container.getModuleList();
console.log('Registered modules:', modules);

// Check container state
console.log('Container ID:', container.id);
console.log('Is testable:', container.isTestable);

// Custom monitoring wrapper
async function withLogging<T>(moduleName: string): Promise<T> {
    console.log(`Building module: ${moduleName}`);
    const start = Date.now();

    const container = await containerPromise;
    const result = container.buildAs<T>(moduleName);

    const duration = Date.now() - start;
    console.log(`Built ${moduleName} in ${duration}ms`);

    return result;
}

// Usage (async because container is Promise-based)
const tokenizer = await withLogging<ITokenizer>('tokenizer');
```

### Package Integration ###

#### External Package Registration ####

For integrating external packages:

```typescript
// Register Node.js built-in modules (container is async)
const container = await containerPromise;
container.registerValue(require('fs'), 'fs');
container.registerValue(require('path'), 'path');

// Register npm packages
container.registerValue(require('lodash'), 'lodash');

// Create wrapper services
container.registerBuilder(
    (fs: any, path: any) => ({
        readFileSync: (filePath: string) => fs.readFileSync(filePath, 'utf8'),
        joinPath: (...segments: string[]) => path.join(...segments)
    }),
    ['fs', 'path'],
    'nodeUtils'
);
```

### Memory Management ###

#### Container Cleanup ####

For long-running applications:

```typescript
// In test environments, clean up containers
afterEach(() => {
    if (testContainer.supportsReplace()) {
        testContainer.restoreAll();
    }
});

// For memory-sensitive applications, you might need custom cleanup
class ManagedService {
    dispose() {
        // Clean up resources
    }
}

// Implement cleanup patterns
const managedServices: ManagedService[] = [];

// Container needs to be async
containerPromise.then(container => {
    container.registerBuilder(
        () => {
            const service = new ManagedService();
            managedServices.push(service);
            return service;
        },
        [],
        'managedService'
    );
});

// Application shutdown
process.on('exit', () => {
    managedServices.forEach(service => service.dispose());
});
```

### Advanced Testing Scenarios ###

#### Partial Mock Replacement ####

```typescript
// Replace only specific methods of a service (container is async)
const container = await containerPromise;
const realFileHandler = container.buildAs<IFileWriter>('fileHandler');

const partialMock = {
    ...realFileHandler,
    read: jest.fn().mockReturnValue({ success: true, value: 'mocked content' })
};

testContainer.replaceValue(partialMock, 'fileHandler');
```

#### State Verification ####

```typescript
// Create stateful service for testing
class StatefulService {
    private state: string[] = [];

    addState(value: string) {
        this.state.push(value);
    }

    getState(): string[] {
        return [...this.state];
    }
}

testContainer.registerValue(new StatefulService(), 'statefulService');

// Test state changes
const service = testContainer.buildAs<StatefulService>('statefulService');
service.addState('test');

expect(service.getState()).toContain('test');
```

<!-- Written By: Jason Kerney -->
<!-- Written By: GitHub Copilot -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->