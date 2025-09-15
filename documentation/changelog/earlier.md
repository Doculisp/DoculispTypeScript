<!-- (dl (section-meta Earlier Versions)) -->

<!-- (dl (# [3.4.0] - 2025-09-08)) -->
<!-- (dl (## Added)) -->
- **Cross-Document Linking**: Added `get-path` command to allow linking to output documents
  - Enables dynamic path resolution for cross-document references
  - Supports complex project structures with multiple output locations

<!-- (dl (# [3.3.0] - 2025-09-07)) -->
<!-- (dl (## Fixed)) -->
- **Header Formatting**: Fixed header indent formatting
- **Author Isolation**: Isolated Authors in Project Documents
  - Improved author attribution handling across document boundaries

<!-- (dl (# [3.2.0] - 2025-09-06)) -->
<!-- (dl (## Added)) -->
- **Header IDs**: Added support for header ids
  - Enables precise cross-referencing and anchor linking
  - Improves navigation within generated documents

<!-- (dl (# [3.1.0] - 2025-09-05)) -->
<!-- (dl (## Added)) -->
- **Section IDs**: Added optional Section ID functionality
  - Enables unique identification of document sections
  - Supports advanced cross-referencing capabilities

<!-- (dl (# [3.0.0] - 2025-09-04)) -->
<!-- (dl (## Breaking Changes)) -->
- **Document IDs**: _**Breaking Change**_ - Updated Document ID requirements
  - Document IDs must now be lowercase
  - Document IDs cannot contain symbols
  - Improves consistency and prevents parsing errors

<!-- (dl (# [2.9.1] - 2025-09-03)) -->
<!-- (dl (## Improved)) -->
- **Link Detection**: Better symbol detection for link processing
  - Enhanced accuracy in link parsing and generation

<!-- (dl (# [2.9.0] - 2025-09-02)) -->
<!-- (dl (## Added)) -->
- **Project Files**: Added support for project files (`.dlproj`)
  - Enables multi-document project management
  - Supports batch processing and complex documentation workflows