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

1. QuickStart: [Quick Start Guide](#quick-start-guide)
2. Resources: [Other Resources](#other-resources)
3. CLI: [Using the Command Line Interface](#using-the-command-line-interface)

## Quick Start Guide ##

Get up and running with Doculisp in just 5 minutes! This guide will show you how to transform a simple README into a modular documentation system.

### What is Doculisp? ###

Doculisp solves the **documentation maintenance problem**. Instead of managing one massive README file, you can break it into smaller, focused files that are easier to edit, review, and collaborate on.

**Before Doculisp:**
- One huge README.md file (200+ lines)
- Merge conflicts when multiple people edit
- Hard to find specific sections to update

**After Doculisp:**
- Multiple small, focused files
- Clear change tracking in git diffs
- Easy collaboration without conflicts

### 5-Minute Tutorial ###

### Step 1: Install Doculisp ###

```bash
npm install -g doculisp
```

### Step 2: Create Your First Modular Document ###

Create a main file called `main.md`:

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

Welcome to my awesome project!

<!-- (dl (content (toc))) -->
```

### Step 3: Create the Include Files ###

Create `install.md`:

```markdown
<!-- (dl (section-meta Installation)) -->

```

bash
npm install my-project
```

Create `usage.md`:

```

markdown

## Usage ##

```javascript
const myProject = require('my-project');
myProject.run();
```

### Step 4: Compile Your Documentation ###

```bash
doculisp main.md README.md
```

**Result:** Doculisp generates a complete `README.md` with:
- A table of contents
- All sections properly combined
- Consistent heading structure

### What You Just Learned ###

✅ **Modular files** - Break documentation into logical pieces
✅ **Include system** - Compose files together automatically
✅ **Table of contents** - Auto-generated navigation
✅ **Clean compilation** - One command creates your final README

### Next Steps ###

- **Small projects:** Start with 2-3 files (installation, usage, contributing)
- **Larger projects:** Create files for each major feature or concept
- **Team projects:** Each team member can own specific documentation files

**Ready to learn more?** Check out the [Language Documentation](./LANG.md) for complete syntax reference, or see [Project File Format](./PROJECT.md) to compile multiple documents at once.

## Other Resources ##

* [Language Documentation](./LANG.md)
* [Project File Format](./PROJECT.md)

## Using the Command Line Interface ##

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

<!-- Written By: jason-kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->