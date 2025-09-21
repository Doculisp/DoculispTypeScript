<!-- (dl (section-meta Project Pipeline Details)) -->

Project files (`.dlproj`) define collections of documents and are processed through a specialized pipeline that handles project-level orchestration and batch processing.

<!-- (dl (# Object Chain for Project Files)) -->

The project pipeline extends the core parsing components with project-specific processing:

```
Controller (IController)
    ↓ detects .dlproj extension
IncludeBuilder.parseProject()
    ↓ [CORE: FileHandler → DocumentParse → Tokenizer → AstParser]
AstProjectParse (IProjectParser)
    ↓ parses project structure into document definitions
[Project-Specific: Multi-document coordination]
    ↓ for each document in project
IncludeBuilder.parse()
    ↓ [CORE: Standard .dlisp or .md pipeline]
StringWriter.writeAst()
    ↓ [CORE: Output generation for each document]
```

<!-- (dl (# Unique Characteristics)) -->

**Project-Specific Processing:**
- **No destination path**: Project files embed output paths in their structure
- **Multi-document orchestration**: Processes multiple source files in single operation
- **Batch variable table management**: Creates child tables for each document
- **Specialized parsing**: Uses `AstProjectParse` instead of `AstDoculispParse`

<!-- (dl (# Project Structure)) -->

Project files define document collections using this structure:

```doculisp
(documents
    (document
        (source ./readme/_main.dlisp)
        (output ../README.md)
    )
    (document
        (id api-guide)
        (source ./api-guide/_main.dlisp)
        (output ../API_GUIDE.md)
    )
)
```

<!-- (dl (# Batch Processing Flow)) -->

1. **Parse project structure** into `IProjectDocuments`
2. **For each document definition:**
   - Create child variable table with source/destination
   - Add document ID to global scope (if specified)
   - Process source file using appropriate pipeline (`.dlisp` or `.md`)
   - Generate output using `StringWriter.writeAst()`
3. **Return array of results** (one per document)

<!-- (dl (# Example Usage)) -->

```typescript
async function compileProject() {
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const projectPath = pathConstructor.buildPath('./docs/docs.dlproj');
    
    // Project files don't need destination path - it's embedded in structure
    const results = controller.compile(projectPath);
    
    results.forEach((result, index) => {
        if (result.success) {
            console.log(`Document ${index + 1} compiled successfully`);
        } else {
            console.error(`Document ${index + 1} failed:`, result.message);
        }
    });
}
```

<!-- (dl (# Performance Characteristics)) -->

**Advantages:**
- Efficient batch processing
- Consistent variable management across documents
- Automated dependency coordination

**Considerations:**
- Highest overhead due to multiple document processing
- Memory usage scales with number of documents
- All documents processed even if only one changed