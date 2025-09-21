<!-- (dl (section-meta Introduction)) -->

The DoculispTypeScript project provides a comprehensive **TypeScript compiler** for the Doculisp documentation language. This API guide covers the **Dependency Injection Container system** and **core compilation pipeline** that powers the compiler.

<!-- (dl (# What This Guide Covers)) -->

This guide provides everything you need to work with the DoculispTypeScript API:

- **Container System**: How to access and work with the dependency injection container
- **Core Architecture**: Understanding the compilation pipeline and component interactions  
- **Pipeline APIs**: Detailed documentation for DocumentParse, Tokenizer, and AstParser
- **Usage Patterns**: Practical examples and common integration scenarios
- **Advanced Topics**: Performance optimization, testing, and custom extensions

<!-- (dl (# Who Should Use This Guide)) -->

**Primary Audience:**
- **Tool Developers**: Building IDE extensions, language servers, or linting tools
- **Integration Developers**: Incorporating Doculisp compilation into existing toolchains
- **Advanced Users**: Needing fine-grained control over the compilation process
- **Contributors**: Working on the DoculispTypeScript project itself

**Alternative Resources:**
- For basic Doculisp usage: See the [User Guide](../user-guide/_main.md)
- For language syntax: See the [Language Specification](../../Lang/AI-Assistant-Codex.md)
- For quick compilation: Use the command-line interface

<!-- (dl (# Getting Started)) -->

The fastest way to access the container system:

```typescript
const { containerPromise } = require('doculisp/dist/moduleLoader');

// Always await the container (it's asynchronous)
const container = await containerPromise;

// Build any registered object with type safety
const controller = container.buildAs<IController>('controller');
const results = controller.compile(sourcePath, destinationPath);
```

**Critical**: The container is asynchronous because modules are loaded dynamically. Always use `await containerPromise` before accessing container functionality.

<!-- (dl (# Key Concepts)) -->

**Dependency Injection Container:**
- Manages all compilation components and their dependencies
- Provides type-safe object creation and lifecycle management
- Enables easy testing through dependency replacement
- Automatically resolves complex dependency chains

**Compilation Pipeline:**
- **DocumentParse**: Extracts Doculisp from documents (first stage)
- **Tokenizer**: Converts content to structured tokens (second stage)  
- **AstParser**: Builds Abstract Syntax Trees (third stage)
- **Semantic Processing**: Converts AST to Doculisp structures
- **Output Generation**: Produces final markdown documents

**File Type Support:**
- **`.dlproj`**: Project files for batch compilation
- **`.dlisp`**: Pure Doculisp structure files
- **`.md`**: Markdown with embedded Doculisp blocks

<!-- (dl (# Important Limitations)) -->

**Variable System Constraints:**
The Doculisp compiler has very limited variable support. The variable table only supports:

- **System-generated string variables**: `source` and `destination` (automatically set during compilation)
- **ID variables**: Used internally for tracking header IDs and ensuring uniqueness

**Custom string variables are NOT supported** - you cannot add arbitrary string variables for use in documents.

<!-- (dl (# Navigation Guide)) -->

**Recommended Reading Order:**

1. **[Container Fundamentals](./container-fundamentals.md)** - Start here to understand the foundation
2. **[Architecture Overview](./architecture-overview.md)** - Learn how components work together
3. **[Core Pipeline APIs](./core-pipeline-apis.md)** - Deep dive into the main APIs
4. **[Usage Patterns](./usage-patterns.md)** - See practical examples and patterns

**Reference Sections:**
- **[Core Objects](./core-objects.md)** - Complete container object reference
- **[Pipeline Overview](./parsing-pipeline-overview.md)** - Detailed pipeline documentation
- **[Testing Patterns](./testing-patterns.md)** - Testing strategies and examples
- **[Advanced Usage](./advanced-usage.md)** - Performance optimization and extensions