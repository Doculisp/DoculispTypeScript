<!-- (dl (section-meta Container Fundamentals)) -->

<!-- (dl (# Understanding the Container System)) -->

The DoculispTypeScript project uses a **Dependency Injection (DI) Container** to manage object creation, dependencies, and lifecycle. This container system is the foundation that orchestrates all compilation pipeline components.

<!-- (dl (## Why Dependency Injection?)) -->

The DI container provides several key benefits:

- **Testability**: Easy mocking and replacement of dependencies during testing
- **Modularity**: Clean separation of concerns and loose coupling
- **Lifecycle Management**: Automatic singleton management and dependency resolution
- **Circular Dependency Detection**: Built-in protection against dependency cycles

<!-- (dl (## Container Architecture)) -->

The container system consists of several interfaces that work together:

- **`IContainer`**: Main interface combining dependency management and registration
- **`IDependencyManager`**: Building and retrieving objects
- **`IDependencyContainer`**: Registering new modules  
- **`ITestableContainer`**: Testing-specific features like dependency replacement

<!-- (dl (## Accessing the Container)) -->

**Critical**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing the container.

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Always await the container first
const container = await containerPromise;
const parser = container.buildAs<ITokenizer>('tokenizer');
```

The container automatically resolves all dependencies and ensures proper initialization order.

<!-- (dl (## Building Objects)) -->

The primary way to get objects from the container is using the `build` methods:

```typescript
// Build with automatic type inference
const tokenizer = container.build('tokenizer');

// Build with explicit typing (recommended)
const parser = container.buildAs<IAstParser>('astParser');
```

<!-- (dl (## Registration Patterns)) -->

Objects are registered automatically by the module loader, but you can also register manually:

<!-- (dl (### Registering Values)) -->

```typescript
// Register a simple value
container.registerValue(myConfig, 'config');

// Register an object with a name property
const logger = { name: 'logger', log: (msg: string) => console.log(msg) };
container.registerValue(logger);
```

<!-- (dl (### Registering Builders)) -->

```typescript
// Register a builder function
container.registerBuilder(
    (dep1: IDep1, dep2: IDep2) => new MyService(dep1, dep2),
    ['dependency1', 'dependency2'],
    'myService',
    true // singleton
);
```

<!-- (dl (### Registration Interface)) -->

All registered modules implement the `IRegisterable` interface:

```typescript
interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}
```

<!-- (dl (## Error Handling)) -->

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

<!-- (dl (## Circular Dependencies)) -->

The container automatically detects circular dependencies and throws descriptive errors:

```
Error: Circular dependencies between ("moduleA" => "moduleB" => "moduleA")
```

<!-- (dl (## Object Lifecycle)) -->

Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls

<!-- (dl (## TypeScript Integration)) -->

When using TypeScript, import types from the package:

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