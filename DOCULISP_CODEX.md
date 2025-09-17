# DoculispTypeScript Project Codex

## Overview

DoculispTypeScript is a TypeScript implementation of the Doculisp language - a scripting language designed for building markdown documents through S-Expression syntax. This codex provides AI assistants with essential knowledge to work effectively within this codebase without overwhelming context.

## Project Architecture

### Core Structure
```
src/
├── index.ts              # CLI entry point with commander.js
├── container.ts          # Dependency injection container
├── moduleLoader.ts       # Module registration and bootstrapping
├── types/               # TypeScript type definitions
├── parsers/             # Document parsing pipeline
├── others/              # Utilities and core functionality
└── tests/               # Comprehensive test suite
```

### Key Technologies
- **TypeScript 4.4.4** with strict configuration
- **Commander.js** for CLI interface
- **Jest** for testing with approval tests
- **Dependency Injection** via custom container
- **Node.js** with CommonJS modules

## Core Concepts

### 1. Doculisp Language Syntax

#### S-Expression Structure
Doculisp uses LISP-style S-expressions without quotation marks:
```doculisp
(command parameter)
(container
    (sub-command parameter)
    (another-command parameter)
)
```

#### File Types
- **`.dlisp`**: Doculisp source files
- **`.dlproj`**: Project files defining multiple documents
- **`.md`**: Markdown files (can contain embedded Doculisp)

#### Key Commands
- `section-meta`: Document metadata and structure
- `title`: Document title
- `include`: External file inclusion with section labels
- `content`: Content placement with optional table of contents
- `toc`: Table of contents configuration
- `author`: Author attribution
- `#`, `##`, `###`: Headers with optional IDs

#### Header ID Syntax (CRITICAL)
When using headers with IDs in Doculisp, the syntax is very strict:
```doculisp
(#id Header Text)        # CORRECT: No space between # and id
(# id Header Text)       # WRONG: Space causes ID to appear in output
```

**Rules:**
- No space between `#` and the ID
- IDs must be unique across the entire compilation scope
- IDs must be lowercase with only hyphens and underscores
- If ID is rendered in the markdown output, there's a space after the `#`

### 2. Document Processing Pipeline

```
Source File → Document Parser → Tokenizer → AST Parser → Doculisp Parser → String Writer → Output
```

#### Pipeline Components
1. **Document Parser**: Extracts text and Doculisp blocks
2. **Tokenizer**: Converts text to tokens (atoms, parameters, parentheses)
3. **AST Parser**: Builds abstract syntax tree
4. **Doculisp Parser**: Converts AST to semantic structures
5. **String Writer**: Generates final markdown output

### 3. Type System

#### Core Result Pattern
```typescript
type Result<T> = ISuccess<T> | IFail;
interface ISuccess<T> { success: true; value: T; }
interface IFail { success: false; message: string; documentPath?: IPath; }
```

#### Key Interfaces
- `ILocation`: File position with line/char coordinates
- `IPath`: File path abstraction with utility methods
- `IVariableTable`: Variable storage with scoping
- `DoculispPart`: Union type for all Doculisp elements

### 4. Dependency Injection

The project uses a custom DI container with:
- **Singleton management**
- **Dependency resolution**
- **Test-time replacement**
- **Circular dependency detection**

## Important Patterns

### 1. Error Handling
All operations return `Result<T>` types. Never throw exceptions - always return failure results with descriptive messages.

### 2. Location Tracking
Every parsed element maintains location information for precise error reporting.

### 3. Variable System
- Global variables (cross-document)
- Local variables (document-scoped)
- Special keys: `' source'`, `' destination'`
- ID validation and uniqueness checking

### 4. Testing
- **Approval tests** for complex outputs
- **Testable containers** for dependency injection
- **Builder pattern** for test setup
- **Mocking** via container replacement

## File Naming Conventions

### User's Personal Style
Files named `main` (like `_main.dlisp`, `_main.md`) indicate entry points - this is the user's personal convention, not a requirement.

### Include Labels
Within include blocks, the first atom is a user-defined label for ToC grouping:
```doculisp
(include
    (Section ./file1.md)    # "Section" groups similar content
    (Release ./version.md)  # "Release" for version-specific content
)
```

## Common Operations

### 1. Adding New Doculisp Commands
1. Define types in `types/types.astDoculisp.ts`
2. Add parsing logic in `parsers/astDoculisp.ts`
3. Add output generation in `others/stringWriter.ts`
4. Create comprehensive tests

### 2. Parser Extension
1. Update tokenizer for new syntax in `parsers/tokenizer.ts`
2. Extend AST structures in `types/types.ast.ts`
3. Add parsing rules in `parsers/ast.ts`

### 3. Variable System Usage
```typescript
// Check existence
variableTable.hasKey('variable-name')

// Add values
variableTable.addValue('key', { type: 'variable-string', value: 'text' })
variableTable.addGlobalValue('key', { type: 'variable-id', value: path, source: location })

// Retrieve values
const variable = variableTable.getValue<IVariableString>('key')
```

## Critical Constraints

### 1. No Quotation Marks
Doculisp parameters are never quoted - they're either S-expressions, lists, or raw strings.

### 2. ID Validation
- Must be lowercase
- No symbols except hyphens and underscores
- Must be unique across entire compilation scope

### 3. Location Preservation
All parsed elements must maintain precise location information for error reporting.

### 4. Immutable Structures
Most data structures are readonly/immutable for safety and predictability.

### 5. Code Block Limitations (CRITICAL)
**Doculisp only supports 3-backtick code fences.** This creates nesting issues:

`````markdown
<!-- THIS FAILS - 4+ backticks not supported -->
````markdown
```bash
echo "hello"
```
````
`````

**Workarounds:**
- Use indented code blocks for inner examples
- Avoid nesting fenced code blocks
- See documentation/FEATURE-TODO.md for planned improvements

**Impact:** When documenting markdown that contains code blocks, you cannot use standard markdown nesting patterns.

## Common Gotchas

1. **Circular Dependencies**: The container detects these - ensure proper dependency ordering
2. **Case Sensitivity**: IDs must be lowercase, but validation exists
3. **Path Handling**: Always use `IPath` abstraction, never raw strings
4. **Variable Scoping**: Understand global vs local variable behavior
5. **Result Handling**: Always check `success` property before accessing `value`
6. **Code Block Nesting**: Cannot use 4+ backtick fences - use indented code or avoid nesting
7. **Header ID Spacing**: No space between `#` and ID: `(#id Text)` not `(# id Text)`

## Development Workflow

### 1. Running Tests
```bash
npm test                 # Run all tests
npm run compile         # TypeScript compilation
npm run start          # Run with ts-node
```

### 2. CLI Usage
```bash
doculisp source.dlisp output.md    # Compile single file
doculisp project.dlproj            # Compile project
doculisp --test source.dlisp       # Validate without output
```

### 3. Debugging
- Use approval tests for complex output verification
- Container replacement for mocking dependencies
- Location information for precise error identification

## Extension Points

### 1. New Output Formats
Extend `IStringWriter` interface and implement new writers.

### 2. Additional File Types
Update document parser and add new file extension handling.

### 3. Custom Commands
Follow the pattern: Types → Parser → Writer → Tests.

This codex provides the essential knowledge needed to work effectively with the DoculispTypeScript codebase while maintaining its architectural principles and conventions.