<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Release: [[3.4.8] - 2025-09-15](#348---2025-09-15)
2. Release: [[3.4.9] - 2025-09-15](#349---2025-09-15)
3. Release: [[3.4.6] - 2025-09-13](#346---2025-09-13)
4. Release: [[3.4.5] - 2025-09-12](#345---2025-09-12)
5. Release: [[3.4.4] - 2025-09-11](#344---2025-09-11)
6. Release: [[3.4.3] - 2025-09-10](#343---2025-09-10)
7. Older: [Previous Releases](#previous-releases)

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

## [3.4.3] - 2025-09-10 ##

### Fixed ###

- **Cross-Document Linking**: Fixed bug with cross-document linking using the `get-path` function
  - Improved stability and accuracy of document path resolution
  - Enhanced error handling for invalid path references

## Previous Releases ##

[Previous Change Logs](./PREVIOUS-CHANGELOG.md)

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->