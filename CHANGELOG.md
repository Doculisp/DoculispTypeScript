<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Release: [[3.4.7] - 2025-09-14](#347---2025-09-14)
2. Release: [[3.4.6] - 2025-09-13](#346---2025-09-13)
3. Release: [[3.4.5] - 2025-09-12](#345---2025-09-12)
4. Release: [[3.4.4] - 2025-09-11](#344---2025-09-11)
5. Release: [[3.4.3] - 2025-09-10](#343---2025-09-10)
6. Release: [[3.4.2] - 2025-09-09](#342---2025-09-09)

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

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->