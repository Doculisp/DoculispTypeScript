<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Release: [[3.4.12] - 2025-09-23](#3412---2025-09-23)
2. Release: [[3.4.10] - 2025-09-16](#3410---2025-09-16)
3. Release: [[3.4.8] - 2025-09-15](#348---2025-09-15)
4. Release: [[3.4.9] - 2025-09-15](#349---2025-09-15)
5. Release: [[3.4.6] - 2025-09-13](#346---2025-09-13)
6. Release: [[3.4.5] - 2025-09-12](#345---2025-09-12)
7. Release: [[3.4.4] - 2025-09-11](#344---2025-09-11)
8. Older: [Previous Releases](#previous-releases)

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

## [3.4.8] - 2025-09-15 ##

### Improved ###

- **Package Distribution**: Added `.npmignore` file to reduce package size and exclude development files from npm distribution
  - Excludes TypeScript source files, tests, and development configurations
  - Reduces package download size for end users
  - Improves installation performance
  - Only includes essential runtime files in published package

## [3.4.9] - 2025-09-15 ##

### Fixed ###

- Fixed an issue in `quickStart.md` where there was an attempt to nest multiline code blocks, which caused formatting problems. The code blocks are now properly formatted for clarity and compatibility.

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