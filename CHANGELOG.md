<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Changelog #

1. Section: [[3.4.8] - 2025-09-15](#348---2025-09-15)
2. Section: [[3.4.7] - 2025-09-14](#347---2025-09-14)
3. Section: [[3.4.6] - 2025-09-13](#346---2025-09-13)
4. Section: [[3.4.5] - 2025-09-12](#345---2025-09-12)
5. Section: [[3.4.4] - 2025-09-11](#344---2025-09-11)
6. Section: [[3.4.3] - 2025-09-10](#343---2025-09-10)
7. Section: [[3.4.2] - 2025-09-09](#342---2025-09-09)
8. Section: [Earlier Versions](#earlier-versions)

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

## Earlier Versions ##

### [3.4.0] - 2025-09-08 ###

#### Added ####

- **Cross-Document Linking**: Added `get-path` command to allow linking to output documents
  - Enables dynamic path resolution for cross-document references
  - Supports complex project structures with multiple output locations

### [3.3.0] - 2025-09-07 ###

#### Fixed ####

- **Header Formatting**: Fixed header indent formatting
- **Author Isolation**: Isolated Authors in Project Documents
  - Improved author attribution handling across document boundaries

### [3.2.0] - 2025-09-06 ###

#### Added ####

- **Header IDs**: Added support for header ids
  - Enables precise cross-referencing and anchor linking
  - Improves navigation within generated documents

### [3.1.0] - 2025-09-05 ###

#### Added ####

- **Section IDs**: Added optional Section ID functionality
  - Enables unique identification of document sections
  - Supports advanced cross-referencing capabilities

### [3.0.0] - 2025-09-04 ###

#### Breaking Changes ####

- **Document IDs**: _**Breaking Change**_ - Updated Document ID requirements
  - Document IDs must now be lowercase
  - Document IDs cannot contain symbols
  - Improves consistency and prevents parsing errors

### [2.9.1] - 2025-09-03 ###

#### Improved ####

- **Link Detection**: Better symbol detection for link processing
  - Enhanced accuracy in link parsing and generation

### [2.9.0] - 2025-09-02 ###

#### Added ####

- **Project Files**: Added support for project files (`.dlproj`)
  - Enables multi-document project management
  - Supports batch processing and complex documentation workflows

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->