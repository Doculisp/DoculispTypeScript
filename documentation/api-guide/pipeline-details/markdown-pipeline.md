<!-- (dl (section-meta Markdown Pipeline Details)) -->

Markdown files (`.md`) contain text content with embedded Doculisp blocks in HTML comments. This pipeline handles dual content extraction and processing while preserving the original text.

<!-- (dl (# Object Chain for Markdown Files)) -->

The markdown pipeline uses the core processing with specialized content extraction:

```
Controller (IController)
    ↓ detects .md extension, sets source/destination variables
IncludeBuilder.parse()
    ↓ [CORE: FileHandler → DocumentParse → Tokenizer → AstParser]
    ↓ [SPECIAL: Dual content extraction]
AstDoculispParse (IAstDoculispParser)
    ↓ processes extracted Doculisp blocks only
IncludeBuilder.parseExternals()
    ↓ [CORE: Include processing pattern]
StringWriter.writeAst()
    ↓ [CORE: Output generation + text preservation]
```

<!-- (dl (# Unique Characteristics)) -->

**Markdown-Specific Processing:**
- **Dual content extraction**: Separates Doculisp blocks from text content
- **HTML comment parsing**: Extracts `<!-- (dl ...) -->` blocks
- **Text preservation**: Maintains original text content through pipeline
- **Mixed parser strategy**: Uses multiple parser types for different content

<!-- (dl (# Content Extraction Process)) -->

```typescript
// Markdown files use mixed content parser
const parser = createStringParser(
    isMultiline(),           // Multi-line text blocks
    isInline(),              // Inline text content
    isComment(),             // HTML comments (Doculisp blocks)
    isWord(),                // Individual words
    isDiscardedNewline(),    // Formatting whitespace
    isKeptWhiteSpaceNoNewLines()  // Preserved whitespace
);

// Results in mixed content:
// - IText parts: Preserved text content
// - ILispBlock parts: Extracted Doculisp code
```

<!-- (dl (# Processing Flow)) -->

1. **Content Separation**: Extract Doculisp from `<!-- (dl ...) -->` comments
2. **Doculisp Processing**: Parse extracted blocks using standard pipeline
3. **Text Preservation**: Maintain original text as `IText` parts
4. **Include Integration**: Recursively process includes from Doculisp blocks
5. **Output Merging**: Combine processed Doculisp with preserved text

<!-- (dl (# HTML Comment Format)) -->

Doculisp must be wrapped in HTML comments with the `dl` wrapper:

```markdown
# My Document

This is regular markdown text that will be preserved.

<!-- (dl (section-meta Documentation)) -->

More markdown content here.

```typescript
// Code blocks are preserved as text
function example() {
    return "hello";
}
```

<!-- (dl (dl (# Dynamic Header)) -->

**All headers should be dynamic** in markdown files intended for Doculisp compilation:

```markdown
<!-- Instead of static headers like this: -->
# Static Header
## Static Subheader

<!-- Use dynamic headers like this: -->
<!-- (dl (# Dynamic Header)) -->
<!-- (dl (## Dynamic Subheader)) -->
```

Final content.
```

<!-- (dl (# Example Processing Result)) -->

**Input Markdown:**
```markdown
# Welcome

Some text here.

<!-- (dl (section-meta Example)) -->

More content.
```

**Resulting Token Structure:**
1. TextToken: "# Welcome\n\nSome text here.\n\n"
2. AtomToken: "section-meta"
3. ParameterToken: "Example"
4. CloseParenthesisToken
5. TextToken: "\n\nMore content."

<!-- (dl (# Usage Pattern)) -->

```typescript
async function compileMarkdownFile() {
    const container = await containerPromise;
    const controller = container.buildAs<IController>('controller');
    const pathConstructor = container.buildAs<IPathConstructor>('pathConstructor');

    const sourcePath = pathConstructor.buildPath('./docs/readme.md');
    const destinationPath = pathConstructor.buildPath('./README.md');
    
    const result = controller.compile(sourcePath, destinationPath);
    
    if (result[0].success) {
        console.log('Markdown file compiled successfully');
        // Output will contain both original text and processed Doculisp
    } else {
        console.error('Compilation failed:', result[0].message);
    }
}
```

<!-- (dl (# Content Rules)) -->

**Text Content:**
- Any valid markdown syntax
- Code blocks and inline code
- Lists, tables, links, images
- Standard markdown formatting

**Doculisp Content:**
- Must be wrapped in `<!-- (dl ...) -->` comments
- Must use valid Doculisp syntax inside comments
- Can include any Doculisp structure or directive

**Dynamic Headers:**
- Use `<!-- (dl (# Title)) -->` instead of `# Title`
- Maintains modularity and proper nesting
- Enables section reorganization and embedding

<!-- (dl (# Error Patterns)) -->

**Common Issues:**
- **Unclosed HTML comments**: `<!-- (dl (section-meta Example)`
- **Invalid Doculisp syntax**: `<!-- (dl section-meta Missing Parentheses) -->`
- **Mixed syntax**: Using both static and dynamic headers

**Example Error:**
```markdown
<!-- (dl (section-meta Example -->
<!-- Missing closing comment -->
```

<!-- (dl (# Output Generation)) -->

The StringWriter merges text and processed Doculisp:

```markdown
<!-- GENERATED DOCUMENT DO NOT EDIT! -->

# Welcome

Some text here.

# Example

More content.
```

<!-- (dl (# Performance Characteristics)) -->

**Moderate Processing Overhead:**
- HTML comment extraction required
- Dual content type processing
- Text preservation through pipeline

**Best For:**
- Documentation with substantial text content
- Mixed content requiring both structure and narrative
- Traditional markdown documents enhanced with Doculisp features