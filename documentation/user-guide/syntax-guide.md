<!-- (dl (section-meta Understanding Doculisp Syntax)) -->

Now that you've seen Doculisp in action, let's understand the simple rules that make it all work. Don't worry – there are only a few concepts to learn!

<!-- (dl (#the-basics The Basics: Instructions in Comments)) -->

Doculisp instructions are written inside special HTML comments that start with `(dl` and end with `)`:

```markdown
<!-- (dl (instruction parameters)) -->
```

**Why comments?** This keeps your source files readable as regular markdown while adding Doculisp superpowers.

<!-- (dl (#parentheses-pattern The Parentheses Pattern)) -->

Doculisp uses a simple pattern inspired by programming languages like Lisp. Everything is written with parentheses:

```doculisp
(command parameter)
(command parameter1 parameter2)
(command
    (sub-command parameter)
    (another-command parameter)
)
```

**Key rules:**
- **No quotation marks** around parameters
- **Spaces separate** different parameters
- **Nested parentheses** create structure
- **Commands are lowercase** with hyphens

<!-- (dl (#essential-commands Essential Commands You'll Use)) -->

### Document Structure Commands

<!-- (dl (##section-meta-command section-meta: Define Your Document)) -->

Every Doculisp file needs to declare what kind of section it is:

```markdown
<!-- (dl (section-meta Section Name)) -->
```

**For your main document:**
```markdown
<!--
(dl
    (section-meta
        (title My Document Title)
        (include
            (Label ./file1.md)
            (Label ./file2.md)
        )
    )
)
-->
```

**For individual sections:**
```markdown
<!-- (dl (section-meta Section Name)) -->
```

<!-- (dl (##include-command include: Combine Multiple Files)) -->

The `include` command tells Doculisp which files to combine:

```doculisp
(include
    (Getting-Started ./getting-started.md)
    (Advanced ./advanced.md)
    (FAQ ./faq.md)
)
```

**The pattern:**
- First word: **Label** (groups similar sections in table of contents)
- Second word: **File path** (relative to current file)

**Labels help organize your table of contents:**
```doculisp
(include
    (Tutorial ./basics.md)      # Tutorial group
    (Tutorial ./advanced.md)    # Tutorial group  
    (Reference ./api.md)        # Reference group
    (Reference ./examples.md)   # Reference group
)
```

<!-- (dl (##content-command content: Place Your Table of Contents)) -->

The `content` command generates your table of contents:

```markdown
<!-- (dl (content (toc))) -->
```

**With custom styling:**
```markdown
<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**Table of contents styles:**
- `numbered-labeled` - "1. Getting Started", "2. Advanced Topics"
- `labeled` - "Getting Started", "Advanced Topics" 
- `numbered` - "1.", "2."

<!-- (dl (#headers-and-sections Headers and Sections)) -->

### Creating Headers

<!-- (dl (##doculisp-headers Doculisp Headers)) -->

Use Doculisp header commands for automatic numbering and linking:

```markdown
<!-- (dl (#header-id Header Text)) -->
```

**Example:**
```markdown
<!-- (dl (#getting-started Getting Started)) -->
<!-- (dl (##installation Installation)) -->
<!-- (dl (###step-one Step One)) -->
```

**The pattern:**
- `#` creates a top-level header
- `##` creates a second-level header  
- `###` creates a third-level header
- First word: **ID** (for linking, lowercase with hyphens)
- Rest: **Display text** (what readers see)

<!-- (dl (##regular-headers Regular Markdown Headers)) -->

You can also use regular markdown headers:

```markdown
### My Header ###
## Another Header
```

**But Doculisp headers are better because:**
- Automatic numbering
- Consistent styling
- Perfect table of contents integration
- Automatic ID generation for links

<!-- (dl (#variables-and-author Variables and Author)) -->

### Author Attribution

Add author information to your documents:

```doculisp
(author Your Name)
```

**In a main document:**
```markdown
<!--
(dl
    (section-meta
        (title My Guide)
        (author Jane Smith)
        (include
            (Section ./intro.md)
        )
    )
)
-->
```

<!-- (dl (#practical-examples Practical Examples)) -->

### Complete File Examples

<!-- (dl (##main-file-example Main File Example)) -->

Here's a complete main file:

```markdown
<!--
(dl
    (section-meta
        (title Complete User Guide)
        (author Development Team)
        (include
            (Introduction ./intro.md)
            (Setup ./installation.md)
            (Setup ./configuration.md)
            (Usage ./basic-usage.md)
            (Usage ./advanced-usage.md)
            (Reference ./api-reference.md)
            (Help ./troubleshooting.md)
            (Help ./faq.md)
        )
    )
)
-->

This is the introduction to our comprehensive user guide.

<!-- (dl (content (toc (style numbered-labeled)))) -->

Thank you for reading our guide!
```

<!-- (dl (##section-file-example Section File Example)) -->

Here's a complete section file:

```markdown
<!-- (dl (section-meta Installation)) -->

This section covers everything you need to install our software.

<!-- (dl (#system-requirements System Requirements)) -->

Before installing, make sure your system meets these requirements:

- Operating System: Windows 10+, macOS 10.14+, or Linux
- Memory: 4GB RAM minimum
- Storage: 100MB available space

<!-- (dl (#download-installation Download and Installation)) -->

Follow these steps to install:

1. Visit our download page
2. Choose your operating system
3. Download the installer
4. Run the installer with default settings

<!-- (dl (##windows-specific Windows-Specific Instructions)) -->

On Windows, you may need to:
- Run as administrator
- Allow the app through Windows Defender
- Add to your PATH environment variable

<!-- (dl (#verify-installation Verify Installation)) -->

After installation, verify everything works:

```bash
our-software --version
```

You should see version information printed to the console.

<!-- (dl (#common-patterns Common Patterns)) -->

### File Organization Patterns

<!-- (dl (##simple-project Simple Project \(3-5 sections\))) -->

```
docs/
├── main.md                 # Main entry point
├── overview.md            # What the project does
├── installation.md        # How to install
├── usage.md              # How to use
└── support.md            # Getting help
```

<!-- (dl (##complex-project Complex Project \(10+ sections\))) -->

```
docs/
├── main.md
├── introduction/
│   ├── overview.md
│   └── getting-started.md
├── guides/
│   ├── basic-usage.md
│   ├── advanced-features.md
│   └── best-practices.md
└── reference/
    ├── api.md
    ├── configuration.md
    └── troubleshooting.md
```
```

<!-- (dl (#syntax-mistakes Common Syntax Mistakes)) -->

### Avoid These Common Mistakes

❌ **Don't use quotation marks:**
```doculisp
(include
    ("Getting Started" ./start.md)  # WRONG
)
```

✅ **Use hyphens for spaces in IDs:**
```doculisp
(include
    (Getting-Started ./start.md)    # CORRECT
)
```

❌ **Don't forget the (dl marker:**
```markdown
<!-- (section-meta My Section) -->    # WRONG
```

✅ **Always include (dl:**
```markdown
<!-- (dl (section-meta My Section)) --> # CORRECT
```

❌ **Don't mix regular markdown headers with table of contents:**
```markdown
### My Header                        # WRONG when using (content (toc))
```

✅ **Use Doculisp headers for TOC integration:**
```markdown
<!-- (dl (#my-header My Header)) --> # CORRECT
```

<!-- (dl (#quick-reference Quick Reference)) -->

### Syntax Quick Reference

**Document structure:**
```doculisp
(section-meta (title Document Title) (author Your Name))
(include (Label ./file.md))
(content (toc (style numbered-labeled)))
```

**Headers:**
```doculisp
(#id Header Text)        # Top level
(##id Header Text)       # Second level  
(###id Header Text)      # Third level
```

**Section files:**
```doculisp
(section-meta Section Name)
```

**Remember:**
- No quotation marks
- Use hyphens in IDs
- Always wrap in `<!-- (dl ...) -->`
- File paths are relative to current file

That's all the syntax you need to know! The next section shows real-world examples of how to use these commands effectively.
