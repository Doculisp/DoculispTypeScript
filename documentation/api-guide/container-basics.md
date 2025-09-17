# Container Basics

## Building Objects

The primary way to get objects from the container is using the `build` methods:

```typescript
import { container } from './container';

// Build with automatic type inference
const tokenizer = container.build('tokenizer');

// Build with explicit typing (recommended)
const parser = container.buildAs<IAstParser>('astParser');
```

## Registration Patterns

Objects are registered automatically by the module loader, but you can also register manually:

### Registering Values

```typescript
// Register a simple value
container.registerValue(myConfig, 'config');

// Register an object with a name property
const logger = { name: 'logger', log: (msg: string) => console.log(msg) };
container.registerValue(logger);
```

### Registering Builders

```typescript
// Register a builder function
container.registerBuilder(
    (dep1: IDep1, dep2: IDep2) => new MyService(dep1, dep2),
    ['dependency1', 'dependency2'],
    'myService',
    true // singleton
);
```

### Registration Interface

All registered modules implement the `IRegisterable` interface:

```typescript
interface IRegisterable {
    readonly builder: (...args: any[]) => Valid<any>;
    readonly name: string;
    readonly dependencies?: string[];
    readonly singleton?: boolean;
}
```

## Error Handling

The container uses the project's `Result<T>` pattern for error handling:

```typescript
const result = container.build('nonExistentModule');
if (!result.success) {
    console.error(result.message);
} else {
    // Use result.value
}
```

## Circular Dependencies

The container automatically detects circular dependencies and throws descriptive errors:

```
Error: Circular dependencies between ("moduleA" => "moduleB" => "moduleA")
```