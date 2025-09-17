<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->

# Previous Releases - Changelog #

## Table of Contents ##

1. Release: [[3.4.3] - 2025-09-10](#343---2025-09-10)
2. Release: [[3.4.2] - 2025-09-09](#342---2025-09-09)
3. Release: [[3.4.0] - 2025-09-08](#340---2025-09-08)
4. Release: [[3.3.0] - 2025-09-07](#330---2025-09-07)
5. Release: [[3.2.0] - 2025-09-06](#320---2025-09-06)
6. Release: [[3.1.0] - 2025-09-05](#310---2025-09-05)
7. Release: [[3.0.0] - 2025-09-04](#300---2025-09-04)
8. Release: [[2.9.1] - 2025-09-03](#291---2025-09-03)
9. Release: [[2.9.0] - 2025-09-02](#290---2025-09-02)

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

## [3.4.0] - 2025-09-08 ##

### Added ###

- **Cross-Document Linking**: Added `get-path` command to allow linking to output documents
  - Enables dynamic path resolution for cross-document references
  - Supports complex project structures with multiple output locations

## [3.3.0] - 2025-09-07 ##

### Fixed ###

- **Header Formatting**: Fixed header indent formatting
- **Author Isolation**: Isolated Authors in Project Documents
  - Improved author attribution handling across document boundaries

* Fixed header indent.
* Isolated Authors in Project Documents.

## [3.2.0] - 2025-09-06 ##

### Added ###

- **Header IDs**: Added support for header ids
  - Enables precise cross-referencing and anchor linking
  - Improves navigation within generated documents

## [3.1.0] - 2025-09-05 ##

### Added ###

- **Section IDs**: Added optional Section ID functionality
  - Enables unique identification of document sections
  - Supports advanced cross-referencing capabilities

## [3.0.0] - 2025-09-04 ##

### Breaking Changes ###

- **Document IDs**: _**Breaking Change**_ - Updated Document ID requirements
  - Document IDs must now be lowercase
  - Document IDs cannot contain symbols
  - Improves consistency and prevents parsing errors

## [2.9.1] - 2025-09-03 ##

### Improved ###

- **Link Detection**: Better symbol detection for link processing
  - Enhanced accuracy in link parsing and generation

## [2.9.0] - 2025-09-02 ##

#### Added ####

- **Project Files**: Added support for project files (`.dlproj`)
  - Enables multi-document project management
  - Supports batch processing and complex documentation workflows

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->