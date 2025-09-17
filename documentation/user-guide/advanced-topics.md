<!-- (dl (section-meta Advanced Topics)) -->

Ready to take your Doculisp skills to the next level? This section covers advanced techniques for power users who want to get the most out of Doculisp.

<!-- (dl (#project-files Project Files dlproj)) -->

Instead of compiling individual documents, you can define multiple documents in a project file. This is perfect for maintaining several related documents (like README.md, CHANGELOG.md, and USER_GUIDE.md) from a single source.

### Creating a Project File

Create a file with `.dlproj` extension:

**`my-project.dlproj`:**
```doculisp-project
(documents
    (document
        (readme
            (source ./docs/readme/main.md)
            (output ./README.md)
        )
    )
    (document
        (user-guide
            (source ./docs/user-guide/_main.dlisp)
            (output ./USER_GUIDE.md)
        )
    )
    (document
        (changelog
            (source ./docs/changelog/_main.dlisp)
            (output ./CHANGELOG.md)
        )
    )
)
```

### Compiling Project Files

```bash
doculisp my-project.dlproj
```

This compiles all documents at once, perfect for maintaining multiple outputs from organized source files.

**Benefits:**
- Compile multiple documents with one command
- Consistent organization across documents
- Easy to add new documents to your project
- Perfect for open source projects with multiple documentation files

<!-- (dl (#pure-doculisp-files Pure Doculisp Files dlisp)) -->

While you can embed Doculisp in markdown files, you can also create pure `.dlisp` files for structured documentation.

### Pure Doculisp Syntax

**`guide.dlisp`:**
```doculisp
(section-meta
    (title Complete User Guide)
    (author Documentation Team)
    (include
        (Introduction ./intro.md)
        (Getting-Started ./start.md)
        (Advanced ./advanced.md)
    )
)

(content (toc numbered-labeled))
```

**When to use .dlisp files:**
- Main entry points for complex documents
- When you want clean, structured document definitions
- For project files that generate multiple outputs
- When working with team members who prefer structured formats

**When to use .md files:**
- Individual content sections
- When you want to preview content in markdown editors
- For files that mix significant content with Doculisp structure
- When collaborating with people unfamiliar with Doculisp

<!-- (dl (#advanced-organization Advanced Organization Patterns)) -->

### Hierarchical File Organization

For large documentation projects, organize files in a hierarchy that mirrors your content structure:

```
docs/
├── main.dlisp                    # Project entry point
├── introduction/
│   ├── _section.md              # Section entry point
│   ├── overview.md
│   ├── why-use-this.md
│   └── getting-help.md
├── tutorials/
│   ├── _section.md
│   ├── beginner/
│   │   ├── first-steps.md
│   │   ├── basic-concepts.md
│   │   └── simple-example.md
│   └── advanced/
│       ├── power-features.md
│       ├── automation.md
│       └── integration.md
└── reference/
    ├── _section.md
    ├── api-reference.md
    ├── configuration.md
    └── troubleshooting.md
```

### Section Entry Points

Use `_section.md` files to define multi-file sections:

**`tutorials/_section.md`:**
```markdown
<!--
(dl
    (section-meta
        (title Tutorials)
        (include
            (Beginner ./beginner/first-steps.md)
            (Beginner ./beginner/basic-concepts.md)
            (Beginner ./beginner/simple-example.md)
            (Advanced ./advanced/power-features.md)
            (Advanced ./advanced/automation.md)
            (Advanced ./advanced/integration.md)
        )
    )
)
-->

This section contains tutorials for users at different skill levels.

<!-- (dl (content (toc))) -->
```

**Main file includes section entry points:**
```doculisp
(section-meta
    (title Complete Documentation)
    (include
        (Introduction ./introduction/_section.md)
        (Tutorials ./tutorials/_section.md)
        (Reference ./reference/_section.md)
    )
)
```

<!-- (dl (#custom-table-of-contents Custom Table of Contents)) -->

### Advanced TOC Styling

Customize your table of contents appearance:

**Custom label:**
```markdown
<!-- (dl (content (toc (label Table of Contents) (style numbered-labeled)))) -->
```

**Different styles:**
```markdown
<!-- (dl (content (toc (style labeled)))) -->          # No numbers
<!-- (dl (content (toc (style numbered)))) -->        # Numbers only
<!-- (dl (content (toc (style numbered-labeled)))) --> # Numbers + labels
```

### Multiple Table of Contents

You can include multiple TOCs in the same document:

```markdown
<!-- Quick Navigation -->
<!-- (dl (content (toc (label Quick Navigation) (style labeled)))) -->

<!-- Main content here -->

<!-- Detailed Table of Contents -->
<!-- (dl (content (toc (label Detailed Contents) (style numbered-labeled)))) -->
```

<!-- (dl (#linking-and-cross-references Linking and Cross-References)) -->

### Internal Linking

Doculisp automatically generates IDs for headers, making internal linking easy:

```markdown
<!-- (dl (#installation-guide Installation Guide)) -->

Content here...

<!-- (dl (#troubleshooting-section Troubleshooting)) -->

If you have problems, check the [Installation Guide](#installation-guide) first.
```

### Cross-Document References

When building complex documentation, you might want to reference other documents:

```markdown
See our [API Reference](./API_REFERENCE.md) for detailed endpoint documentation.

For deployment information, check the [Deployment Guide](./docs/deployment/guide.md).
```

<!-- (dl (#team-workflows Team Workflows)) -->

### Multi-Team Documentation

For large organizations, set up clear ownership and workflows:

**Team-based organization:**
```
docs/
├── main.dlisp                    # Documentation lead owns
├── product/                      # Product team owns
│   ├── overview.md
│   ├── features.md
│   └── roadmap.md
├── engineering/                  # Engineering team owns
│   ├── api-reference.md
│   ├── deployment.md
│   └── architecture.md
├── support/                      # Support team owns
│   ├── troubleshooting.md
│   ├── faq.md
│   └── contact.md
└── legal/                        # Legal team owns
    ├── privacy.md
    ├── terms.md
    └── compliance.md
```

### Review Workflows

**Establish clear review processes:**

1. **Subject matter expert review** - Team that owns the content reviews for accuracy
2. **Documentation review** - Documentation team reviews for clarity and style
3. **Technical review** - Someone verifies examples and code snippets work
4. **Final compilation** - Verify Doculisp compiles cleanly

### Automated Workflows

**Set up CI/CD for documentation:**

```yaml
# Example GitHub Actions workflow
name: Documentation
on: [push, pull_request]
jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -g doculisp
      - run: doculisp docs/project.dlproj
      - run: git diff --exit-code  # Fail if docs aren't up to date
```

<!-- (dl (#advanced-performance-optimization Performance Optimization)) -->

### Optimizing Large Documents

For very large documentation projects:

**Split large files:**
```
Instead of:
├── user-guide.md              # 2000 lines

Use:
├── user-guide/
│   ├── _main.md              # Structure only
│   ├── getting-started.md    # 200 lines
│   ├── basic-usage.md        # 300 lines
│   ├── advanced-usage.md     # 400 lines
│   └── troubleshooting.md    # 250 lines
```

**Logical grouping:**
- Group related concepts in the same file
- Keep individual files under 500 lines when possible
- Use descriptive file names that make content obvious

### Memory Management

For extremely large projects:

```bash
# Increase Node.js memory if needed
node --max-old-space-size=4096 $(which doculisp) large-project.dlproj
```

<!-- (dl (#extending-doculisp Extending Doculisp)) -->

### Integration with Other Tools

**Combine with static site generators:**
```bash
# Generate documentation
doculisp docs/project.dlproj

# Build static site
jekyll build
# or
hugo build
# or
gitbook build
```

**Integration with documentation platforms:**
- Generate markdown for GitBook
- Create content for Confluence
- Build static sites with Jekyll/Hugo
- Generate PDFs with pandoc

### Custom Build Scripts

**Create build scripts for complex workflows:**

```bash
#!/bin/bash
# build-docs.sh

echo "Building documentation..."

# Compile main documentation
doculisp docs/main.dlproj

# Generate API docs
generate-api-docs

# Copy images and assets
cp -r docs/images/ output/

# Build static site
hugo build

echo "Documentation build complete!"
```

<!-- (dl (#quality-assurance Quality Assurance)) -->

### Automated Testing

**Test your documentation automatically:**

```bash
# Test that docs compile
doculisp docs/project.dlproj

# Test that output files exist
test -f README.md || (echo "README.md not generated" && exit 1)
test -f USER_GUIDE.md || (echo "USER_GUIDE.md not generated" && exit 1)

# Test for common issues
grep -q "Table of Contents" README.md || (echo "TOC missing" && exit 1)
```

### Link Checking

**Verify internal and external links:**

```bash
# Check for broken internal links
markdown-link-check README.md

# Check all generated files
find . -name "*.md" -exec markdown-link-check {} \;
```

### Content Validation

**Check for common content issues:**

```bash
# Look for placeholder text
grep -r "TODO\|FIXME\|XXX" docs/

# Check for consistent terminology
grep -r "inconsistent-term" docs/

# Verify all images exist
grep -r "!\[.*\](" docs/ | while read line; do
    # Extract image path and verify file exists
done
```

<!-- (dl (#advanced-tips Advanced Tips and Tricks)) -->

### Power User Techniques

**Use consistent patterns across your organization:**

```doculisp
# Standard include pattern for all projects
(include
    (Getting-Started ./getting-started.md)
    (User-Guide ./user-guide.md)
    (API-Reference ./api-reference.md)
    (Troubleshooting ./troubleshooting.md)
)
```

**Create template structures:**
```
project-template/
├── docs/
│   ├── main.dlisp
│   ├── getting-started.md
│   ├── user-guide.md
│   └── troubleshooting.md
└── scripts/
    └── build-docs.sh
```

### Documentation as Code

**Treat documentation like code:**
- Version control everything
- Code review all changes
- Automate builds and deployment
- Test that examples work
- Maintain coding standards for documentation

**Use branches for major documentation changes:**
```bash
git checkout -b feature/new-user-guide
# Make documentation changes
git commit -m "Add comprehensive user guide"
# Create pull request for review
```

These advanced techniques will help you build sophisticated, maintainable documentation systems that scale with your project and team!
