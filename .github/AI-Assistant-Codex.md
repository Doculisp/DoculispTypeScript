# Doculisp AI Assistant Codex

**A Comprehensive Guide for AI Assistants to Generate Doculisp DSL Code**

This codex provides everything an AI assistant needs to understand and generate Doculisp DSL code effectively. Doculisp is a Lisp-inspired domain-specific language for creating modular, maintainable markdown documentation.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Syntax Fundamentals](#syntax-fundamentals)
3. [Block Structure Patterns](#block-structure-patterns)
4. [Common Workflows](#common-workflows)
5. [File Organization](#file-organization)
6. [Best Practices](#best-practices)
7. [Error Prevention](#error-prevention)
8. [Quick Reference](#quick-reference)

## Core Concepts

### What is Doculisp?

Doculisp is a **modular documentation system** that solves the problem of unwieldy, monolithic README files. It allows you to:

- **Break large documents** into smaller, focused files
- **Maintain consistency** across documentation structure
- **Enable collaborative editing** without merge conflicts
- **Generate standard markdown** that works everywhere

### Key Philosophy

- **Modularity over monoliths**: Split content into logical, manageable pieces
- **Structure over chaos**: Enforce consistent organization patterns
- **Maintainability over convenience**: Optimize for long-term maintenance
- **Standard output**: Generate regular markdown files that work on any platform

### File Types

1. **`.dlisp` files**: Pure Doculisp structure only - NO text content allowed, used for structure and metadata only
2. **`.md` files**: Markdown with embedded Doculisp blocks in HTML comments - can contain text content
3. **`.dlproj` files**: Project configuration for batch compilation

### Critical File Type Rules

- **`.dlisp` files**: MUST contain only Doculisp structure (titles, includes, TOCs). NO text content.
- **`.md` files**: Required for ANY text content. Doculisp must be wrapped in HTML comments.
- **If your document has text content**: Use `.md` with embedded Doculisp blocks
- **If your document is structure-only**: Use `.dlisp` for clean syntax

## Syntax Fundamentals

### Block Structure

All Doculisp code follows this pattern:
```
(identifier)                    # Simple identifier
(identifier parameter)          # Identifier with parameter
(identifier (sub-identifier))        # Nested identifiers
```

### Critical Rules

1. **No quotation marks**: Parameters are literal strings without quotes
2. **HTML comments for .md files**: Wrap Doculisp in `<!-- (dl ...) -->`
3. **Raw syntax for .dlisp files**: No HTML comments or `dl` wrapper needed
4. **Text content requires .md files**: .dlisp files can ONLY contain structure, never text
5. **ALL headings must be dynamic**: In .md files for Doculisp compilation, use `<!-- (dl (# Title)) -->` not `# Title`
6. **Parameter limits**: Max 255 characters, no newlines, no unescaped parentheses
7. **Escape parentheses**: Use backslash `\)` to include literal parentheses

### The Master Block

In `.md` files, all Doculisp must be wrapped:
```markdown
<!-- (dl
    (section-meta
        (title My Document)
    )
) -->
```

In `.dlisp` files, write directly:
```doculisp
(section-meta
    (title My Document)
)
```

## Block Structure Patterns

### section-meta Block

The `section-meta` block defines document structure and metadata:

```doculisp
(section-meta
    (title Document Title)
    (subtitle Optional Subtitle)
    (author Author Name)
    (id unique-identifier)
    (ref-link custom-link-text)
    (include
        (Section-Name ./path/to/file.md)
        (Another-Section ./path/to/another.md)
        (*Commented-Section ./disabled.md)
    )
)
```

**Format Preference:** When `section-meta` only contains a title, favor the shorter single-line format:
```doculisp
(section-meta Title)
```
Rather than the expanded format:
```doculisp
(section-meta
    (title Title)
)
```

**Key components:**
- `title`: **Required** - Main document title
- `subtitle`: Optional - Creates H3 under title
- `author`: Optional - Can appear multiple times
- `id`: Optional - Unique identifier for linking
- `ref-link`: Optional - Fallback link text when Doculisp cannot auto-generate proper markdown links due to special characters or parsing issues
- `include`: Optional - List of included files

### content Block

The `content` block controls where included content appears and table of contents:

```doculisp
(content
    (toc
        (label Table of Contents)
        (style numbered-labeled)
    )
)
```

**TOC Styles:**
- `no-table`: No TOC
- `unlabeled`: No section names
- `labeled`: Section names only
- `numbered`: Numbers only
- `numbered-labeled`: Numbers + section names
- `bulleted`: Bullets only
- `bulleted-labeled`: Bullets + section names

### Dynamic Headings

**CRITICAL**: In markdown files intended for Doculisp compilation, **ALL** headings should be dynamic headings. Static markdown headings (# ## ###) break modularity and prevent sections from being reorganized or embedded.

Create structure-aware headings that adjust based on document hierarchy:

```doculisp
<!-- (dl (# Main Section)) -->
<!-- (dl (## Subsection)) -->
<!-- (dl (### Details)) -->
```

The number of `#` determines depth relative to current section level.

**Why all headings must be dynamic:**
- Enables section reorganization without breaking hierarchy
- Allows sections to be embedded in other documents
- Maintains proper heading levels when document structure changes
- Preserves modularity - the core benefit of Doculisp

### Comments

Comment out any block by prefixing the identifier with `*`:

```doculisp
(*section-meta
    (title This is commented out)
)

(include
    (Active-Section ./active.md)
    (*Disabled-Section ./disabled.md)
)
```

### Path IDs and Linking

Create unique identifiers and link between documents:

```doculisp
(section-meta
    (title Installation Guide)
    (id installation-guide)
)

<!-- Reference from another document -->
See the [installation instructions](<!-- (dl (get-path installation-guide)) -->).
```

### ref-link Fallback Mechanism

The `ref-link` block provides a fallback mechanism for when Doculisp cannot automatically generate proper markdown links due to special characters, unicode, or parsing ambiguities in the title:

```doculisp
(section-meta
    (title Doculisp is awesome ✨🚀)
    (ref-link doculisp-is-awesome)
)
```

**When to use ref-link:**
- Title contains special characters that break markdown linking
- Unicode characters that cause link generation issues  
- Complex punctuation that Doculisp misinterprets
- Any situation where auto-generated links don't work properly

**How it works:**
- Doculisp attempts to auto-generate the link portion of `[text](link)`
- If that fails or produces invalid links, a user can specify the `ref-link` value and Doculisp will use that instead.
- The `ref-link` becomes the `link` part of the markdown hyperlink syntax


## Common Workflows

### Basic Document Structure

**Simple single-file document (.md with embedded Doculisp):**
```markdown
<!-- (dl
    (section-meta
        (title Project Name)
        (author Your Name)
    )
) -->

<!-- (dl (# Introduction)) -->
Welcome to the project.

<!-- (dl (## Getting Started)) -->
First steps to use this project.

<!-- (dl (# Installation)) -->
Installation instructions here.

<!-- (dl (## Prerequisites)) -->
What you need before installing.

<!-- (dl (content (toc numbered-labeled))) -->
```

**Note**: ALL headings use dynamic syntax `<!-- (dl (# Title)) -->` to maintain modularity.

**Structure-only document (.dlisp file):**
```doculisp
(section-meta
    (title Project Name)
    (author Your Name)
    (include
        (Introduction ./docs/_intro.md)
        (Installation ./docs/_install.md)
    )
)

(content (toc numbered-labeled))
```

**Modular multi-file document:**
```doculisp
(section-meta
    (title Comprehensive Guide)
    (include
        (Introduction ./docs/_intro.md)
        (Installation ./docs/_install.md)
        (Usage ./docs/_usage.md)
        (API ./docs/_api.md)
    )
)

(content
    (toc
        (label Table of Contents)
        (style numbered-labeled)
    )
)
```

### Include Patterns

**Standard includes:**
```doculisp
(include
    (Getting-Started ./docs/_getting-started.md)
    (User-Guide ./docs/_user-guide.md)
    (Developer-Guide ./docs/_dev-guide.md)
)
```

**Hierarchical includes:**
```doculisp
(include
    (Quick-Start ./quick/_main.md)
    (User-Manual ./manual/_main.md)
    (Developer-Docs ./dev/_main.md)
    (*Draft-Features ./drafts/_main.md)
)
```

### Project Files (.dlproj)

Manage multiple documents with project files:

```lisp
(documents
    (document
        (source ./docs/main.dlisp)
        (output ./README.md)
    )
    (document
        (source ./docs/contributing.dlisp)
        (output ./CONTRIBUTING.md)
    )
    (document
        (source ./docs/api.dlisp)
        (output ./docs/API.md)
    )
)
```

## File Organization

### Naming Conventions

- **Include files**: Start with underscore `_` (e.g., `_installation.md`)
- **Main files**: Clear descriptive names (e.g., `main.dlisp`, `readme.dlisp`)
- **Project files**: Use `.dlproj` extension

### Directory Structure

```
project/
├── docs/
│   ├── main.dlisp              # Main document structure
│   ├── _intro.md               # Include file
│   ├── _installation.md        # Include file
│   ├── _usage.md               # Include file
│   └── sections/
│       ├── _getting-started.md
│       ├── _advanced.md
│       └── _api.md
├── project.dlproj              # Project configuration
└── README.md                   # Generated output
```

### Modular Organization

- **Single responsibility**: Each file has one clear purpose
- **Logical grouping**: Related content in same directory
- **Clear hierarchy**: Directory structure mirrors document structure
- **Identifieric changes**: Edit individual files rather than large documents

## Best Practices

### Content Strategy

1. **Start simple**: Don't over-modularize small documents
2. **Natural breaking points**: Split when sections grow >50 lines
3. **Logical cohesion**: Group related information together
4. **Clear naming**: Use descriptive file and section names

### Structure Guidelines

1. **Consistent patterns**: Use same organization across projects
2. **Include prefixes**: Always use `_` for include files
3. **Unique IDs**: Ensure all IDs are globally unique and lowercase
4. **Clear hierarchy**: Maintain logical document structure

### Development Workflow

1. **Test early**: Use `--test` flag during development
2. **Iterative approach**: Compile frequently to catch issues
3. **Version control friendly**: Structure for meaningful git diffs
4. **Tool integration**: Use VS Code extension for optimal experience

### Variable and Naming

- **Section names**: Use hyphens for spaces (Getting-Started → "Getting Started")
- **File paths**: Use relative paths (./docs/_file.md)
- **IDs**: Lowercase, hyphens/underscores only, globally unique
- **Parameters**: No quotes, escape parentheses with backslash

## Error Prevention

### Common Mistakes

1. **Using quotes**: Parameters don't need quotes - they're literal
2. **Missing HTML comments**: Required for `.md` files with Doculisp
3. **Text content in .dlisp files**: .dlisp files can ONLY contain structure - any text content requires .md files
4. **Using static headings**: In Doculisp .md files, use `<!-- (dl (# Title)) -->` not `# Title` to maintain modularity
5. **Duplicate IDs**: All IDs must be globally unique
6. **Invalid characters**: IDs must be lowercase with only hyphens/underscores
7. **Circular includes**: Don't create circular file dependencies

### Validation

Always test documents before deployment:
```bash
doculisp main.dlisp --test              # Test single file
doculisp project.dlproj --test          # Test entire project
```

### File Path Issues

- Use relative paths from the document location
- Ensure include files exist
- Check file extensions match expectations
- Verify directory structure

## Quick Reference

### Essential Patterns

**Basic document:**
```doculisp
(section-meta Document Title)
```

**With includes:**
```doculisp
(section-meta
    (title Main Document)
    (include
        (Section-One ./docs/_section1.md)
        (Section-Two ./docs/_section2.md)
    )
)

(content (toc numbered-labeled))
```

**Dynamic heading:**
```doculisp
<!-- (dl (# Section Title)) -->
```

**Comments:**
```doculisp
(*commented-block
    (content here)
)
```

**Cross-reference:**
```doculisp
[Link text](<!-- (dl (get-path section-id)) -->)
```

### Block Quick Reference

| Block | Purpose | Required |
|-------|---------|----------|
| `section-meta` | Document metadata | No |
| `title` | Document title | If section-meta used |
| `include` | Include other files | No |
| `content` | Content placement | If includes used |
| `toc` | Table of contents | No |
| `#`, `##`, etc. | Dynamic headings | No |
| `id` | Unique identifier | No |
| `get-path` | Cross-reference | No |

### Compilation Commands

```bash
# Single file
doculisp source.dlisp output.md

# Test validation
doculisp source.dlisp --test

# Project file
doculisp project.dlproj

# Project validation
doculisp project.dlproj --test
```

---

This codex provides the foundation for AI assistants to understand and generate effective Doculisp DSL code. Focus on modularity, clear structure, and maintainable documentation patterns.