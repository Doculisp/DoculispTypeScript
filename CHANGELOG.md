<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Release: [[6.0.0] - 2026-03-28](#600---2026-03-28)
2. Release: [[5.0.1] - 2025-12-14](#501---2025-12-14)
3. Release: [[5.0.0] - TBD](#500---tbd)
4. Release: [[4.0.0] - 2025-10-13](#400---2025-10-13)
5. Release: [[3.4.12] - 2025-09-23](#3412---2025-09-23)
6. Release: [[3.4.10] - 2025-09-16](#3410---2025-09-16)
7. Release: [[3.4.9] - 2025-09-15](#349---2025-09-15)
8. Release: [[3.4.8] - 2025-09-15](#348---2025-09-15)
9. Release: [[3.4.7] - 2025-09-14](#347---2025-09-14)
10. Release: [[3.4.6] - 2025-09-13](#346---2025-09-13)
11. Release: [[3.4.5] - 2025-09-12](#345---2025-09-12)
12. Release: [[3.4.4] - 2025-09-11](#344---2025-09-11)
13. Older: [Previous Releases](#previous-releases)

## [6.0.0] - 2026-03-28 ##

### Breaking Changes ###

- **Doculisp API Upgrade**: Updated doculisp-api from 3.1.0 to 4.0.0
  - **Include Validation Enforcement**: The API now enforces the documented rule that include blocks with external files must have a content block
  - **Breaking Change Impact**: Doculisp files using include blocks with external files but no content block will now fail validation
  - **Migration Required**: All include blocks containing external file references must have a corresponding `(content)` block
  - **Error Messages**: Clear validation error when include has external files but no content block
    - Error format: `"Validation Error: The section-meta block at '[path]' has an include block with external files but no content block. A content block is required when including external files."`
    - Includes precise location information (line and character positions) for easy debugging
  - **Empty Include Support**: Empty include blocks (without external files) continue to work without requiring content blocks

### Improved ###

- **Error Reporting**: Enhanced error message consistency and precision throughout the parsing pipeline
  - **Standardized Error Format**: All error messages follow consistent formatting with proper prefixes and punctuation
    - Parse errors use `"Parse Error:"` prefix with clear descriptions
    - Validation errors use `"Validation Error:"` prefix with specific context
    - File system errors include full path information and operation details
  - **Enhanced Location Tracking**: Error messages include precise range information with start and end positions
    - Range objects provide exact character positions for error highlighting
    - Line and character details included in error messages for better debugging
  - **Improved Error Context**: Better contextual information for troubleshooting
    - Detailed failure messages with line and character information
    - Consistent error formatting across all parsers and components

- **Documentation**: Access to comprehensive API documentation
  - **Complete API Guide**: Detailed documentation for all major pipeline components
  - **Type System Documentation**: Complete interface and type documentation
  - **Design Philosophy**: Documentation of core API design principles and patterns
  - **Usage Examples**: Integration patterns and best practices

## [5.0.1] - 2025-12-14 ##

### Improved ###

- **Dependency Update**: Updated doculisp-api from 1.0.1 to 3.0.0 for enhanced performance and reliability
  - **Enhanced Error Handling**: Improved error reporting with structured error categorization and processing step tracking
  - **Better Location Tracking**: More precise error location tracking for improved debugging experience
  - **AST Block Range Support**: Foundation for future advanced editing features (transparent to CLI users)
  - **Tokenizer Improvements**: Enhanced whitespace validation and syntax error detection
  - **Performance Optimizations**: Improved parser performance and memory efficiency
  - **No Breaking Changes**: All existing CLI functionality remains identical
  - **Backward Compatible**: Same command-line interface, arguments, and output format

## [5.0.0] - TBD ##

### Breaking Changes ###

- **API Terminology Update**: Updated all language terminology from "atom" to "identifier" throughout the DoculispAPI integration
  - **Token Types**: `AtomToken` → `IdentifierToken`
  - **AST Types**: `IAstAtom` → `IAstIdentifier`, `AtomAst` → `IdentifierAst`
  - **Parser Functions**: `parseAtom()` → `parseIdentifier()`, `tokenizeAtom()` → `tokenizeIdentifier()`
  - **Type Interfaces**: Updated all type definitions to use "identifier" terminology
  - **Error Messages**: Changed from "Unknown atom" to "Unknown identifier"
  - **Test Files**: Updated test names and expectations to use identifier terminology
  - This affects error message parsing in automated tools and any API integrations

- **Error Message Format Changes**: Major standardization of all error messages with new prefixes and formatting
  - **Parse Errors**: Now use `"Parse Error:"` prefix with location format `(Line: X, Char: Y)`
  - **Validation Errors**: Now use `"Validation Error:"` prefix with enhanced context
  - **Controller Validation**: Standardized messages like `"Validation Error: Must have a destination file."`
  - **File Operations**: Enhanced messages like `"Validation Error: File load failed: [reason] (Path: [fullPath])."`
  - **Location Format**: Changed from `Line: X, Char: Y` to `(Line: X, Char: Y)` with parentheses
  - All automated tools depending on specific error message formats will need updates

### Improved ###

- **Error Messages**: Comprehensive overhaul of error message quality across the entire system
  - **Controller Module**: Standardized validation errors with consistent prefixes and punctuation
  - **File Handler**: Enhanced file operation errors with full context and path information
  - **Doculisp AST Parser**: Complete standardization of semantic validation error messages
  - **Project AST Parser**: Enhanced project file parsing errors with standardized formatting
  - **Include Builder**: Standardized include validation error messages
  - **AST Parser**: Complete standardization of core AST parsing error messages
  - **Document Parser**: Complete overhaul with standardized formatting and clear descriptions
  - **Container System**: All dependency injection errors now include clear prefixes and context
  - **String Writer**: Standardized document ID reference error messages
  - **Better Debugging**: All error messages now include file paths, operation context, and clear failure reasons

- **Code Clarity**: The terminology change from "atom" to "identifier" provides clearer understanding
  - Function names and keywords in Doculisp are now consistently called "identifiers"
  - More intuitive for developers familiar with programming language terminology
  - Better alignment with standard compiler and parser terminology

- **Documentation Quality**: Enhanced project documentation structure and AI assistant integration
  - Added comprehensive GitHub Copilot instructions (.copilot-instructions.md) with Arlo's Risk-Aware Commit Notation guidelines
  - Added AI Assistant Codex (.github/AI-Assistant-Codex.md) for improved AI assistant interactions with Doculisp DSL
  - Improved documentation clarity and development workflow guidance

### Documentation ###

- **Documentation Restructure**: Major reorganization of project documentation
  - Removed obsolete API guide documentation (documentation/api-guide/)
  - Added comprehensive GitHub Copilot instructions (.copilot-instructions.md)
  - Added AI Assistant Codex (.github/AI-Assistant-Codex.md) for improved AI assistant interactions
  - Renamed LANG.md to LANGUAGE-SPEC.md for clarity
  - Updated project configuration to reflect new documentation structure

### Technical Details ###

- **DoculispAPI Integration**: Updated to integrate with DoculispAPI 2.0.0
  - Language Specification version bumped to 2.0.0 reflecting breaking terminology changes
  - Parser Infrastructure: All parser handlers updated to use identifier terminology
  - Type System: Complete type system refactoring for consistency
  - Internal APIs: All internal function signatures updated to match API changes

- **Error Handling Infrastructure**: Complete overhaul of error message generation
  - Systematic error message standardization initiative across entire codebase
  - Standardized error message prefixes across all modules (`Parse Error:`, `Validation Error:`, etc.)
  - Enhanced error context with file paths and operation details
  - Consistent location format: `(Line: X, Char: Y)` with proper punctuation
  - Improved error message consistency and readability
  - Enhanced error propagation through the processing pipeline

## [4.0.0] - 2025-10-13 ##

### Breaking Changes ###

- **Pure CLI Architecture**: Converted from library + CLI to pure CLI application
  - **Removed Library API**: All internal TypeScript APIs, containers, parsers, and type interfaces have been removed from the public API surface
  - **CLI Only**: The package now functions exclusively as a command-line tool, no longer exposable as a library
  - **Massive Codebase Reduction**: Removed over 15,000 lines of internal implementation code that was previously part of the public API
  - **Package Simplification**: Dramatically reduced package complexity and installation footprint
  - This is a breaking change for any projects that were importing DoculispTypeScript as a library rather than using it as a CLI tool

## [3.4.12] - 2025-09-23 ##

### Improved ###

- **TypeScript API Export**: Exported all types to make the API easier to use for TypeScript developers
  - Public types are now available for import to improve development experience
  - Enhanced type safety and IntelliSense support for API consumers
  - Simplified integration for TypeScript projects using DoculispTypeScript as a library

## [3.4.10] - 2025-09-16 ##

### Fixed ###

- **Multiline Code Block Parsing**: Fixed a bug where multiline code blocks defined with 4 or more backticks would cause the compiler to fail and report a malformed markdown document
  - Code blocks with 4+ backticks are now properly recognized and parsed
  - Closing markers no longer require trailing whitespace and can end at line boundaries
  - Prevents compilation failures for valid markdown documents containing extended code blocks

## [3.4.9] - 2025-09-15 ##

### Fixed ###

- Fixed an issue in `quickStart.md` where there was an attempt to nest multiline code blocks, which caused formatting problems. The code blocks are now properly formatted for clarity and compatibility.

## [3.4.8] - 2025-09-15 ##

### Improved ###

- **Package Distribution**: Added `.npmignore` file to reduce package size and exclude development files from npm distribution
  - Excludes TypeScript source files, tests, and development configurations
  - Reduces package download size for end users
  - Improves installation performance
  - Only includes essential runtime files in published package

## [3.4.7] - 2025-09-14 ##

### Improved ###

- **Documentation**: Updated documentation and improved project structure

## [3.4.6] - 2025-09-13 ##

### Fixed ###

- **Project File Testing**: Fixed `-t` flag now works for project files
  - Command line testing mode properly supports `.dlproj` files
  - Enables syntax validation without output file generation for projects

## [3.4.5] - 2025-09-12 ##

### Fixed ###

- **Cross-Document Linking**: Fixed inter-document linking to headers
  - Improved reliability of header references across multiple documents
  - Enhanced anchor generation and resolution

## [3.4.4] - 2025-09-11 ##

### Fixed ###

- **Path Resolution**: Fixed issue where path was not always complete in cross-document linking using `get-path` function
  - Improved path resolution accuracy for cross-document references
  - Enhanced reliability of document linking across complex project structures

## Previous Releases ##

[Previous Change Logs](./PREVIOUS-CHANGELOG.md)

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->