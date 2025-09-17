<!-- (dl (section-meta Getting Started)) -->

Let's get you up and running with Doculisp! This step-by-step tutorial will have you creating modular documentation in about 10 minutes.

<!-- (dl (#installation Installation)) -->

### Step 1: Install Doculisp

Doculisp requires Node.js to run. If you don't have Node.js installed:

1. **Visit [nodejs.org](https://nodejs.org)**
2. **Download the LTS version** (the green button)
3. **Run the installer** with default settings

Once Node.js is installed, open your command line (Terminal on Mac/Linux, Command Prompt or PowerShell on Windows) and run:

```bash
npm install -g doculisp
```

**Verify the installation** by running:
```bash
doculisp --version
```

You should see a version number. If you get an error, restart your command line and try again.

<!-- (dl (#first-document Your First Doculisp Document)) -->

Let's create a simple project documentation to understand how Doculisp works.

### Step 2: Create Your Project Folder

Create a new folder for your documentation project:

```bash
mkdir my-documentation
cd my-documentation
```

### Step 3: Create the Main Document

Create a file called `main.md` and add this content:

```markdown
<!--
(dl
    (section-meta
        (title My Awesome Project)
        (include
            (Overview ./overview.md)
            (Installation ./installation.md)
            (Usage ./usage.md)
            (FAQ ./faq.md)
        )
    )
)
-->

Welcome to my project! This documentation will help you get started quickly.

<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**What's happening here?**
- The `<!--` and `-->` marks contain Doculisp instructions
- `section-meta` defines the document's title and structure
- `include` tells Doculisp which files to combine
- `content` with `toc` creates a table of contents

### Step 4: Create the Individual Sections

Now create each file referenced in the include list:

**Create `overview.md`:**
```markdown
<!-- (dl (section-meta Overview)) -->

This project solves the common problem of managing complex documentation by breaking it into manageable pieces.

Key benefits:
- Easy to maintain
- Great for team collaboration
- Professional appearance
```

**Create `installation.md`:**
```markdown
<!-- (dl (section-meta Installation)) -->

Getting started is simple:

1. Download the latest release
2. Extract to your preferred directory
3. Add to your system PATH
4. Verify installation with `my-project --version`
```

**Create `usage.md`:**
```markdown
<!-- (dl (section-meta Usage)) -->

Basic usage examples:

    my-project input.txt output.txt
    my-project --help

<!-- (dl (#advanced-usage Advanced Usage)) -->

For power users, additional options are available:

    my-project --verbose input.txt output.txt
    my-project --config custom.json input.txt
```

**Create `faq.md`:**
```markdown
<!-- (dl (section-meta FAQ)) -->

<!-- (dl (#common-questions Common Questions)) -->

**Q: Is this free to use?**
A: Yes, completely free and open source.

**Q: Does it work on Windows?**
A: Yes, it works on Windows, Mac, and Linux.

**Q: Where can I get help?**
A: Check our GitHub issues or community forum.
```

### Step 5: Compile Your Documentation

Now for the magic! Run this command to compile your documentation:

```bash
doculisp main.md README.md
```

**Open `README.md`** to see your compiled documentation. You'll notice:
- A professional table of contents with numbering
- All sections combined in the right order
- Consistent header formatting
- Working internal links

<!-- (dl (#understanding-the-result Understanding What Happened)) -->

Doculisp took your modular files and:

1. **Read the main file** to understand your document structure
2. **Included each referenced file** in the specified order
3. **Generated a table of contents** automatically
4. **Numbered all headers** consistently
5. **Created internal links** that work perfectly

<!-- (dl (#making-changes Making Changes)) -->

### Step 6: Edit and Recompile

Try making a change:

1. **Edit `overview.md`** - add a new paragraph
2. **Run the compile command again:**
   ```bash
   doculisp main.md README.md
   ```
3. **Check `README.md`** - your changes are reflected in the final document

**This is the Doculisp workflow:**
- Edit individual files (much easier than one giant file)
- Recompile to generate the final document
- Share or publish the compiled result

<!-- (dl (#next-level Taking It to the Next Level)) -->

### Step 7: Add More Structure

Let's add a new section. First, edit your `main.md` file to include a troubleshooting section:

```markdown
<!--
(dl
    (section-meta
        (title My Awesome Project)
        (include
            (Overview ./overview.md)
            (Installation ./installation.md)
            (Usage ./usage.md)
            (FAQ ./faq.md)
            (Support ./troubleshooting.md)
        )
    )
)
-->

Welcome to my project! This documentation will help you get started quickly.

<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**Create `troubleshooting.md`:**
```markdown
<!-- (dl (section-meta Troubleshooting)) -->

<!-- (dl (#common-issues Common Issues)) -->

**Installation fails with permission error:**
Try running with administrator privileges or using sudo on Unix systems.

**Command not found:**
Make sure the installation directory is in your system PATH.

<!-- (dl (#getting-more-help Getting More Help)) -->

If you're still having trouble:
1. Check our documentation
2. Search existing issues
3. Create a new issue with details
```
d
**Recompile:**
```bash
doculisp main.md README.md
```

Notice how the table of contents updated automatically!

<!-- (dl (#congratulations Congratulations!)) -->

You now understand the core Doculisp workflow:

✅ **Create a main file** that defines structure  
✅ **Write individual section files** for easy editing  
✅ **Compile to generate** professional documentation  
✅ **Iterate quickly** by editing and recompiling  

<!-- (dl (#what-next What's Next?)) -->

Now you're ready to:
- **Learn the syntax** in detail
- **Explore real-world use cases** 
- **Discover best practices** for organizing your documentation
- **Handle advanced scenarios** like variables and cross-references

The next section will teach you everything about Doculisp syntax – but you already know the most important concepts!
