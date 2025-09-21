<!-- (dl (section-meta Core Objects Reference)) -->

<!-- (dl (# Parser Pipeline Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `tokenizer` | `ITokenizer` | Converts raw text into tokens (atoms, parentheses, parameters) |
| `astParser` | `IAstParser` | Builds Abstract Syntax Tree from tokens |
| `astDoculispParse` | `IAstDoculispParser` | Converts AST to Doculisp semantic structures |
| `astProjectParse` | `IAstProjectParser` | Parses `.dlproj` project files |
| `documentParse` | `IDocumentParser` | Extracts Doculisp blocks from markdown documents |

<!-- (dl (# Output Generation Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `stringWriter` | `IStringWriter` | Generates final markdown output from parsed structures |
| `stringBuilder` | `IStringBuilder` | Utility for building strings with proper formatting |

<!-- (dl (# File and Path Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `fileHandler` | `IFileWriter` | File system operations (read, write, exists) |
| `pathConstructor` | `IPathConstructor` | Creates and manipulates `IPath` objects |

<!-- (dl (# Data Management Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `variableTable` | `IVariableTable` | Manages system variables (`source`, `destination`) and ID tracking |
| `includeBuilder` | `IIncludeBuilder` | Processes include statements and builds document trees |
| `structure` | `IStructure` | Analyzes document structure and relationships |

<!-- (dl (# Control and Orchestration Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `controller` | `IController` | Main compilation controller with compile/test methods |
| `internals` | `IInternals` | Internal processing utilities and helpers |

<!-- (dl (# Utility Objects)) -->

| Container Key | Interface | Description |
|---------------|-----------|-------------|
| `util` | `IUtil` | General utilities including Result<T> helpers |
| `utilBuilder` | `IUtilBuilder` | Utility builders and factory methods |
| `textHelpers` | `ITextHelpers` | Text processing and formatting utilities |
| `trimArray` | `ITrimArray` | Array manipulation utilities |
| `searches` | `ISearches` | Search and lookup utilities |
| `version` | `IVersion` | Version information and management |

<!-- (dl (# Object Lifecycle)) -->

Most objects are registered as **singletons**, meaning:
- One instance per container
- Dependencies are resolved once
- State is maintained across calls

<!-- (dl (# Key Interface Examples)) -->

<!-- (dl (## ITokenizer)) -->
```typescript
interface ITokenizer {
    tokenize(input: string, path: IPath): Result<Token[]>;
}
```

<!-- (dl (## IVariableTable)) -->
```typescript
interface IVariableTable {
    getValue<T extends IVariable>(key: string): Result<T>;
    hasKey(key: string): boolean;
    // Note: Limited functionality - primarily for system variables and ID tracking
    // Only supports system-generated string variables: 'source' and 'destination'
    // Custom string variables are NOT supported
}
```

<!-- (dl (## IController)) -->
```typescript
interface IController {
    compile(sourcePath: IPath, outputPath?: IPath): Result<string>;
    test(sourcePaths: IPath[]): Result<string>[];
}
```