<!-- (dl (section-meta Get Started)) -->

Get up and running with Doculisp in just 5 minutes! This guide will show you how to transform a simple README into a modular documentation system.

<!-- (dl (# What is Doculisp?)) -->

Doculisp solves the **documentation maintenance problem**. Instead of managing one massive README file, you can break it into smaller, focused files that are easier to edit, review, and collaborate on.

**Before Doculisp:**
- One huge README.md file (200+ lines)
- Merge conflicts when multiple people edit
- Hard to find specific sections to update

**After Doculisp:**
- Multiple small, focused files
- Clear change tracking in git diffs
- Easy collaboration without conflicts

<!-- (dl (# 5-Minute Tutorial)) -->

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

npm install my-project
```

Create `usage.md`:

```markdown
<!-- (dl (section-meta Usage)) -->

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

<!-- (dl (# What You Just Learned)) -->

✅ **Modular files** - Break documentation into logical pieces  
✅ **Include system** - Compose files together automatically  
✅ **Table of contents** - Auto-generated navigation  
✅ **Clean compilation** - One command creates your final README

<!-- (dl (# Next Steps)) -->

- **Small projects:** Start with 2-3 files (installation, usage, contributing)
- **Larger projects:** Create files for each major feature or concept
- **Team projects:** Each team member can own specific documentation files

**Ready to learn more?** Check out the [Language Documentation](./LANG.md) for complete syntax reference, or see [Project File Format](./PROJECT.md) to compile multiple documents at once.