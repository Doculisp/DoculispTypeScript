<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Release: [[5.0.0] - TBD](#500---tbd)
2. Release: [[4.0.0] - 2025-10-13](#400---2025-10-13)
3. Release: [[3.4.12] - 2025-09-23](#3412---2025-09-23)
4. Release: [[3.4.10] - 2025-09-16](#3410---2025-09-16)
5. Release: [[3.4.9] - 2025-09-15](#349---2025-09-15)
6. Release: [[3.4.8] - 2025-09-15](#348---2025-09-15)
7. Release: [[3.4.7] - 2025-09-14](#347---2025-09-14)
8. Release: [[3.4.6] - 2025-09-13](#346---2025-09-13)
9. Release: [[3.4.5] - 2025-09-12](#345---2025-09-12)
10. Release: [[3.4.4] - 2025-09-11](#344---2025-09-11)
11. Release: [[3.4.3] - 2025-09-10](#343---2025-09-10)
12. Release: [[3.4.2] - 2025-09-09](#342---2025-09-09)
13. Older: [Previous Releases](#previous-releases)

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

## [3.4.3] - 2025-09-10 ##

### Fixed ###

- **Cross-Document Linking**: Fixed bug with cross-document linking using the `get-path` function
  - Improved stability and accuracy of document path resolution
  - Enhanced error handling for invalid path references

## [3.4.2] - 2025-09-09 ##

### Fixed ###

- **Error Handling**: Fixed bug where `get-path` throws exception if path id does not exist
  - Added proper validation for path IDs before resolution
  - Improved error messages for missing path references
  - Enhanced stability when processing malformed documents

## Previous Releases ##

[Previous Change Logs](./PREVIOUS-CHANGELOG.md)

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->