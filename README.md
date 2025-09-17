<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: jason-kerney -->

# Doculisp #

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |
```

A Compiler for Doculisp Lang.

## Table of Contents ##

1. Section: [Why Doculisp?](#why-doculisp)
2. Section: [Get Started](#get-started)
3. Section: [Installation & Usage](#installation--usage)
4. Section: [Learn More](#learn-more)

## Why Doculisp? ##

### The Documentation Maintenance Problem ###

As developers, we've all been there: staring at a massive README file that's become unwieldy, outdated, and frankly intimidating to update. Traditional documentation approaches create several pain points:

- **Monolithic files** that are difficult to navigate and edit
- **Merge conflicts** when multiple contributors update different sections
- **Unclear change impact** when reviewing large file diffs
- **Context switching overhead** when editing unrelated documentation sections
- **Inconsistent structure** across different projects and teams

Doculisp solves these problems by bringing **modularity and structure** to markdown documentation.

### Why Developers Love Doculisp ###

#### 🎯 **Focused Editing** ####

Break your README into logical, manageable chunks. Need to update the installation instructions? Open just the `installation.md` file. Working on API documentation? Focus solely on `api.md`. No more scrolling through hundreds of lines to find the section you need.

#### 🔍 **Clear Change Tracking** ####

Git diffs become meaningful again. Instead of seeing "README.md changed 47 lines," you see exactly which conceptual sections were modified: `installation.md`, `troubleshooting.md`, etc.

#### 🤝 **Better Collaboration** ####

Multiple team members can work on different documentation sections simultaneously without merge conflicts. The documentation author editing the introduction won't conflict with the API maintainer updating endpoint documentation.

#### 📐 **Consistent Structure** ####

The `section-meta` blocks enforce consistent organization across all your documentation, making it easier for new team members to contribute and for users to find information.

#### ⚡ **Maintainability** ####

Small, focused files are easier to review, update, and refactor. When documentation grows, you can easily reorganize by moving files rather than cut-and-paste operations in large documents.

#### 🔄 **Effortless Restructuring** ####

Need to promote a section to its own document? Simply move the file and update the `include` block. What starts as a subsection can easily become a standalone document with its own table of contents and structure. No copy-paste, no broken links, no manual reorganization - just move files and update references.

#### 🔗 **Resilient Cross-References** ####

Every section and header can have a unique ID that enables dynamic linking within and across documents. Reference other sections with `(get-path id)` and Doculisp automatically generates the correct links. Best of all: when you restructure documentation and promote sections to standalone documents, as long as the IDs remain the same, all existing links continue to work seamlessly.

### Why Doculisp Over Other Options? ###

#### vs. Traditional Markdown ####

**Traditional approach**: One massive README.md file that becomes harder to manage over time.
**Doculisp advantage**: Modular files with structured includes, maintaining the simplicity of markdown while adding organization.

#### vs. Documentation Generators (GitBook, Docusaurus, etc.) ####

**Documentation generators**: Complex setup, learning curve, often overkill for project READMEs.
**Doculisp advantage**: Zero learning curve if you know markdown. Generates standard markdown files that work everywhere GitHub is supported.

#### vs. Wiki Systems ####

**Wiki systems**: Separate from your codebase, requires context switching, can become disconnected from code changes.
**Doculisp advantage**: Lives in your repository, versioned with your code, integrated into your development workflow.

#### vs. Raw File Splitting ####

**Manual file splitting**: No standard structure, inconsistent organization, manual assembly required.
**Doculisp advantage**: Structured metadata system, automated assembly, consistent patterns across projects.

### Getting Started: A Practical Approach ###

#### Start Simple, Grow Naturally ####

**Don't over-engineer from day one.** If your current README is manageable, keep it as-is. Doculisp shines when documentation becomes complex enough that modularization provides real value.

**Recommended progression:**
1. **Single file**: Start with a traditional README.md
2. **Natural breaking points**: When sections grow large (>50 lines) or become logically distinct, extract them
3. **Gradual adoption**: Begin with obvious candidates like installation instructions, API documentation, or troubleshooting guides
4. **Full structure**: Eventually organize into a complete Doculisp project when the benefits are clear

**Signs it's time to modularize:**
- Your README is over 200 lines
- Multiple people need to edit different sections
- You find yourself searching within the file to find specific content
- Merge conflicts are happening in documentation
- You're copying documentation patterns between projects

**Pro tip**: The goal is easier maintenance, not complexity. If splitting a small section into its own file makes editing *harder*, don't do it.

## Get Started ##

Get up and running with Doculisp in just 5 minutes!

### What is Doculisp? ###

Doculisp solves the **documentation maintenance problem**. Instead of managing one massive README file, you can break it into smaller, focused files that are easier to edit, review, and collaborate on.

**Before Doculisp:** One huge README.md file with merge conflicts
**After Doculisp:** Multiple small, focused files with clean collaboration

### Quick Start ###

### 1. Install ###

```bash
npm install -g doculisp
```

### 2. Create main.md ###

```markdown
<!--
(dl
    (section-meta
        (title My Project)
        (include
            (Installation ./install.md)
            (Usage ./usage.md)
        )
    )
)
-->

<!-- (dl (content (toc))) -->
```

### 3. Create section files ###

**install.md:**
````markdown
<!-- (dl (section-meta Installation)) -->

```bash
npm install my-project
```
````

**usage.md:**
````markdown
<!-- (dl (section-meta Usage)) -->

```javascript
const myProject = require('my-project');
myProject.run();
```
````

### 4. Compile ###

```bash
doculisp main.md README.md
```

**Result:** Complete README with table of contents and combined sections.

### Next Steps ###

For comprehensive tutorials, examples, and best practices, see the [User Guide](./USER_GUIDE.md).

## Installation & Usage ##

### To Install Doculisp ###

To install the cli globally run the following command: `npm i -g doculisp`

To install the cli locally run the following command: `npm i doculisp --save-dev`

### Running the Doculisp compiler ###

If you have Doculisp installed globally then you can run `doculisp` from the command line.

If you have Doculisp installed locally then you can run `node ./node_modules/doculisp/dist/index.js` from the command line.

### Using the Doculisp compiler ###

If you run Doculisp with the help option : `doculisp --help` you will see the following:

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |

            Compiler Version: N.N.N
            Language Version: N.N.N

Usage: doculisp [options] [source] [output]

A compiler for markdown

Arguments:
  source         the path to the file to compile
  output         the path to the output location including output file name

Options:
  -V, --version  output the version number
  -t, --test     runs the compiler without generating the output file
  --update       updates doculisp
  -h, --help     display help for command
```

When using `--test` only the source path if mandatory.
When compiling both the source and destination are mandatory.

## Learn More ##

* [User Guide](./USER_GUIDE.md) - Complete guide with tutorials and best practices
* [Language Documentation](./LANG.md) - Language syntax reference
* [Project File Format](./PROJECT.md) - Multi-document compilation

<!-- Written By: jason-kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->