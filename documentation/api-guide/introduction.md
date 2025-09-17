# Introduction

The DoculispTypeScript project uses a custom **Dependency Injection (DI) Container** to manage object creation, dependencies, and lifecycle. This guide provides comprehensive information about how to work with the container system and understand the core objects available in the compilation pipeline.

## Why Dependency Injection?

The DI container provides several key benefits:

- **Testability**: Easy mocking and replacement of dependencies during testing
- **Modularity**: Clean separation of concerns and loose coupling
- **Lifecycle Management**: Automatic singleton management and dependency resolution  
- **Circular Dependency Detection**: Built-in protection against dependency cycles

## Container Architecture

The container system consists of several interfaces:

- `IContainer`: Main interface combining dependency management and registration
- `IDependencyManager`: Building and retrieving objects
- `IDependencyContainer`: Registering new modules
- `ITestableContainer`: Testing-specific features like dependency replacement

## Getting Started

The container is automatically populated with all available modules when the application starts. You can access it through:

```typescript
import { container } from './container';

// Build any registered object
const parser = container.buildAs<ITokenizer>('tokenizer');
```

The container automatically resolves all dependencies and ensures proper initialization order.

## Important Note About Variables

The Doculisp compiler has very limited variable support. The variable table only supports:

- **System-generated string variables**: `source` and `destination` (automatically set during compilation)
- **ID variables**: Used internally for tracking header IDs and ensuring uniqueness

**Custom string variables are NOT supported** - you cannot add arbitrary string variables for use in documents.