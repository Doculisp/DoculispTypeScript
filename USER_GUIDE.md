<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: Jason Kerney -->

# Doculisp User Guide #

1. Introduction: [Introduction](#introduction)
2. Getting Started: [Getting Started](#getting-started)
3. Understanding Syntax: [Understanding Doculisp Syntax](#understanding-doculisp-syntax)
4. Common Use Cases: [Common Use Cases](#common-use-cases)
5. Best Practices: [Best Practices](#best-practices)
6. Troubleshooting: [Troubleshooting](#troubleshooting)
7. Advanced Topics: [Advanced Topics](#advanced-topics)

## Introduction ##

## What is Doculisp?

Doculisp is a **documentation composition tool** that helps you write better, more maintainable documentation. Instead of wrestling with one massive README file that becomes harder to manage over time, Doculisp lets you break your documentation into smaller, focused pieces that are easier to write, edit, and collaborate on.

Think of it like building with LEGO blocks – instead of carving one giant piece of stone, you create small, reusable pieces that snap together perfectly to form something beautiful and functional.

### Why Use Doculisp? ###

### The Documentation Problem You Know Too Well

If you've ever worked on a project (whether it's software, research, or any collaborative work), you've probably experienced these frustrations:

**The Massive File Problem:**
- Your README.md file has grown to 300+ lines
- Finding specific information feels like searching for a needle in a haystack
- Making small changes requires scrolling through endless text

**The Collaboration Nightmare:**
- Multiple people can't edit documentation simultaneously without conflicts
- Changes get lost in huge file diffs
- It's hard to review what actually changed in a documentation update

**The Maintenance Burden:**
- Keeping table of contents in sync with content is manual work
- Cross-references break when you reorganize sections
- Updating similar information across multiple places is error-prone

### How Doculisp Solves These Problems

#### Modular Approach ####

**Instead of one huge file, create many focused files:**
- `installation.md` - Just installation instructions
- `getting-started.md` - Quick start tutorial
- `advanced-features.md` - Deep dive topics
- `troubleshooting.md` - Common problems and solutions

**Doculisp automatically combines these into a polished final document.**

#### Automatic Organization ####

**Table of contents generation:**
- Doculisp builds your table of contents automatically
- Links work perfectly every time
- Reorganize sections without breaking anything

**Consistent formatting:**
- Headers are numbered and styled consistently
- Cross-references update automatically
- Professional appearance with minimal effort

#### Better Team Collaboration ####

**Git-friendly workflow:**
- Each team member can work on different files simultaneously
- Small, focused commits are easier to review
- Clear change history shows exactly what was modified

### Who Should Use Doculisp? ###

Doculisp is perfect for anyone who needs to create and maintain documentation:

**📝 Technical Writers** who want to focus on content, not formatting

**👥 Project Teams** who need multiple people contributing to documentation

**🔬 Researchers** creating papers, reports, or documentation with many sections

**📚 Open Source Maintainers** managing README files, wikis, and contributor guides

**🏢 Organizations** standardizing their documentation practices

**👩‍💻 Individual Creators** who want their documentation to look professional

### What You'll Learn in This Guide ###

This user guide will teach you everything you need to know to become productive with Doculisp:

1. **Getting Started** - Installation and your first document
2. **Understanding the Syntax** - The simple rules that make everything work
3. **Common Use Cases** - Real-world examples you can adapt
4. **Best Practices** - How to organize your documentation for maximum effectiveness
5. **Troubleshooting** - Solutions to common problems
6. **Advanced Topics** - Power user techniques

### No Programming Experience Required ###

**Don't worry if you're not a programmer!** Doculisp was designed to be approachable for anyone who can write text in a basic text editor. You'll learn everything you need as you go, and we'll explain concepts in plain language.

The examples in this guide are written for real people solving real documentation problems – no computer science degree required.

**Ready to get started?** Let's dive into the Getting Started section and create your first Doculisp document in just a few minutes!

## Getting Started ##

Let's get you up and running with Doculisp! This step-by-step tutorial will have you creating modular documentation in about 10 minutes.

### Installation ###

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

### Your First Doculisp Document ###

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

### Understanding What Happened ###

Doculisp took your modular files and:

1. **Read the main file** to understand your document structure
2. **Included each referenced file** in the specified order
3. **Generated a table of contents** automatically
4. **Numbered all headers** consistently
5. **Created internal links** that work perfectly

### Making Changes ###

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

### Taking It to the Next Level ###

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

**Recompile:**
```bash
doculisp main.md README.md
```

Notice how the table of contents updated automatically!

### Congratulations! ###

You now understand the core Doculisp workflow:

✅ **Create a main file** that defines structure
✅ **Write individual section files** for easy editing
✅ **Compile to generate** professional documentation
✅ **Iterate quickly** by editing and recompiling

### What's Next? ###

Now you're ready to:
- **Learn the syntax** in detail
- **Explore real-world use cases**
- **Discover best practices** for organizing your documentation
- **Handle advanced scenarios** like variables and cross-references

The next section will teach you everything about Doculisp syntax – but you already know the most important concepts!

## Understanding Doculisp Syntax ##

Now that you've seen Doculisp in action, let's understand the simple rules that make it all work. Don't worry – there are only a few concepts to learn!

### The Basics: Instructions in Comments ###

Doculisp instructions are written inside special HTML comments that start with `(dl` and end with `)`:

```markdown
<!-- (dl (instruction parameters)) -->
```

**Why comments?** This keeps your source files readable as regular markdown while adding Doculisp superpowers.

### The Parentheses Pattern ###

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

### Essential Commands You'll Use ###

### Document Structure Commands

#### section-meta: Define Your Document ####

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

#### include: Combine Multiple Files ####

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

#### content: Place Your Table of Contents ####

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

### Headers and Sections ###

### Creating Headers

#### Doculisp Headers ####

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

#### Regular Markdown Headers ####

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

### Variables and Author ###

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

### Practical Examples ###

### Complete File Examples

#### Main File Example ####

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

#### Section File Example ####

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

### Common Patterns ###

### File Organization Patterns

#### Simple Project (3-5 sections) ####

```
docs/
├── main.md                 # Main entry point
├── overview.md            # What the project does
├── installation.md        # How to install
├── usage.md              # How to use
└── support.md            # Getting help
```

#### Complex Project (10+ sections) ####

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

### Quick Reference ###

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

## Common Use Cases ##

Let's explore real-world scenarios where Doculisp shines. These examples show you how to adapt Doculisp for different types of documentation projects.

### Open Source Project README ###

**Scenario:** You maintain an open source project with a comprehensive README that's become unwieldy.

**Before Doculisp:** One 400-line README.md that's hard to navigate and edit.

**After Doculisp:** Multiple focused files that compile into a polished README.

### File Structure:
```
project/
├── docs/
│   ├── main.md              # Entry point
│   ├── overview.md          # What it does
│   ├── installation.md      # Install instructions
│   ├── quick-start.md       # 5-minute tutorial
│   ├── api-reference.md     # Full API docs
│   ├── contributing.md      # Contributor guide
│   ├── changelog.md         # Recent changes
│   └── support.md          # Getting help
└── README.md               # Generated output
```

### Main File (`docs/main.md`):
```markdown
<!--
(dl
    (section-meta
        (title ProjectName)
        (author Development Team)
        (include
            (Overview ./overview.md)
            (Getting-Started ./installation.md)
            (Getting-Started ./quick-start.md)
            (Documentation ./api-reference.md)
            (Community ./contributing.md)
            (Community ./support.md)
            (Release-Notes ./changelog.md)
        )
    )
)
-->

# ProjectName

A brief tagline describing what your project does.

![Build Status](https://img.shields.io/badge/build-passing-green)
![License](https://img.shields.io/badge/license-MIT-blue)

<!-- (dl (content (toc (style numbered-labeled)))) -->

## License

MIT License - see LICENSE file for details.
```

**Benefits:**
- Contributors can edit specific sections without conflicts
- Clean git diffs show exactly what changed
- Easy to maintain table of contents
- Professional appearance

### Software User Manual ###

**Scenario:** Your software needs comprehensive user documentation.

**Challenge:** Users have different skill levels and need different information.

**Solution:** Organize by user journey and skill level.

### File Structure:
```
user-docs/
├── main.md
├── introduction/
│   ├── what-is-this.md
│   └── system-requirements.md
├── getting-started/
│   ├── installation.md
│   ├── first-time-setup.md
│   └── quick-tutorial.md
├── user-guide/
│   ├── basic-features.md
│   ├── advanced-features.md
│   └── customization.md
├── tutorials/
│   ├── tutorial-beginners.md
│   ├── tutorial-power-users.md
│   └── tutorial-integration.md
└── support/
    ├── troubleshooting.md
    ├── faq.md
    └── getting-help.md
```

### Main File Strategy:
```markdown
<!--
(dl
    (section-meta
        (title Software User Guide)
        (author Documentation Team)
        (include
            (Introduction ./introduction/what-is-this.md)
            (Introduction ./introduction/system-requirements.md)
            (Getting-Started ./getting-started/installation.md)
            (Getting-Started ./getting-started/first-time-setup.md)
            (Getting-Started ./getting-started/quick-tutorial.md)
            (User-Guide ./user-guide/basic-features.md)
            (User-Guide ./user-guide/advanced-features.md)
            (User-Guide ./user-guide/customization.md)
            (Tutorials ./tutorials/tutorial-beginners.md)
            (Tutorials ./tutorials/tutorial-power-users.md)
            (Tutorials ./tutorials/tutorial-integration.md)
            (Support ./support/troubleshooting.md)
            (Support ./support/faq.md)
            (Support ./support/getting-help.md)
        )
    )
)
-->

Welcome to our comprehensive user guide! Whether you're just getting started or looking to master advanced features, this guide has you covered.

<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**Why this works:**
- Logical progression from basics to advanced
- Grouped sections in table of contents
- Easy to update specific workflows
- Each team member can own different sections

### Academic Research Paper ###

**Scenario:** You're writing a research paper or thesis with multiple chapters.

**Challenge:** Long documents are hard to reorganize and collaborate on.

**Solution:** Break into logical chapters that can be worked on independently.

### File Structure:
```
research-paper/
├── paper.md               # Main document
├── abstract.md
├── introduction.md
├── literature-review.md
├── methodology.md
├── results.md
├── discussion.md
├── conclusion.md
├── acknowledgments.md
└── references.md
```

### Main File (`paper.md`):
```markdown
<!--
(dl
    (section-meta
        (title Research Paper Title)
        (author Dr. Jane Smith)
        (include
            (Front-Matter ./abstract.md)
            (Content ./introduction.md)
            (Content ./literature-review.md)
            (Content ./methodology.md)
            (Content ./results.md)
            (Content ./discussion.md)
            (Content ./conclusion.md)
            (Back-Matter ./acknowledgments.md)
            (Back-Matter ./references.md)
        )
    )
)
-->

<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**Academic Benefits:**
- Each chapter can be worked on independently
- Easy to reorganize sections
- Co-authors can contribute specific chapters
- Version control shows clear chapter-level changes
- Automatic formatting and numbering

### Team Knowledge Base ###

**Scenario:** Your team needs a central knowledge base or wiki.

**Challenge:** Multiple people need to contribute and maintain different areas.

**Solution:** Organized by team responsibilities and knowledge areas.

### File Structure:
```
knowledge-base/
├── main.md
├── onboarding/
│   ├── new-employee-guide.md
│   ├── team-overview.md
│   └── tools-and-access.md
├── processes/
│   ├── development-workflow.md
│   ├── code-review-process.md
│   ├── deployment-process.md
│   └── incident-response.md
├── technical/
│   ├── architecture-overview.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── infrastructure.md
└── policies/
    ├── security-guidelines.md
    ├── data-privacy.md
    └── code-standards.md
```

### Ownership Strategy:
- **HR owns:** onboarding/
- **Engineering leads own:** processes/
- **Senior developers own:** technical/
- **Compliance team owns:** policies/

**Team Benefits:**
- Clear ownership of different sections
- Easy to keep documentation current
- New team members get comprehensive, organized information
- No merge conflicts when multiple people update different areas

### Product Documentation ###

**Scenario:** You're documenting a product with multiple features and user types.

**Challenge:** Different users need different information at different times.

**Solution:** Organize by user goals and feature sets.

### File Structure:
```
product-docs/
├── main.md
├── getting-started/
│   ├── what-is-product.md
│   ├── signing-up.md
│   └── first-steps.md
├── features/
│   ├── core-features.md
│   ├── collaboration-tools.md
│   ├── reporting-analytics.md
│   └── integrations.md
├── how-to-guides/
│   ├── common-workflows.md
│   ├── advanced-techniques.md
│   └── automation-recipes.md
├── admin/
│   ├── user-management.md
│   ├── security-settings.md
│   └── billing-account.md
└── troubleshooting/
    ├── common-issues.md
    ├── error-messages.md
    └── contact-support.md
```

### Multi-Audience Approach:
```markdown
<!--
(dl
    (section-meta
        (title Product Documentation)
        (author Product Team)
        (include
            (Getting-Started ./getting-started/what-is-product.md)
            (Getting-Started ./getting-started/signing-up.md)
            (Getting-Started ./getting-started/first-steps.md)
            (Features ./features/core-features.md)
            (Features ./features/collaboration-tools.md)
            (Features ./features/reporting-analytics.md)
            (Features ./features/integrations.md)
            (How-To ./how-to-guides/common-workflows.md)
            (How-To ./how-to-guides/advanced-techniques.md)
            (How-To ./how-to-guides/automation-recipes.md)
            (Administration ./admin/user-management.md)
            (Administration ./admin/security-settings.md)
            (Administration ./admin/billing-account.md)
            (Support ./troubleshooting/common-issues.md)
            (Support ./troubleshooting/error-messages.md)
            (Support ./troubleshooting/contact-support.md)
        )
    )
)
-->

Welcome to our product! This documentation covers everything from getting started to advanced administration.

<!-- (dl (content (toc (style numbered-labeled)))) -->
```

### API Documentation ###

**Scenario:** You're documenting a REST API or software library.

**Challenge:** Developers need both quick reference and detailed examples.

**Solution:** Organize by endpoint groups and usage patterns.

### File Structure:
```
api-docs/
├── main.md
├── overview/
│   ├── introduction.md
│   ├── authentication.md
│   └── rate-limits.md
├── endpoints/
│   ├── users-api.md
│   ├── projects-api.md
│   ├── files-api.md
│   └── webhooks-api.md
├── guides/
│   ├── quick-start.md
│   ├── common-patterns.md
│   └── best-practices.md
└── reference/
    ├── error-codes.md
    ├── data-formats.md
    └── changelog.md
```

**Why this structure works:**
- Developers can find specific endpoints quickly
- Examples and patterns are separate from reference material
- Easy to maintain as API evolves
- Clear separation between getting started and detailed reference

### Choosing Your Structure ###

### Guidelines for Any Project

**Start with user goals:**
- What are people trying to accomplish?
- In what order do they need information?
- What skill levels are you supporting?

**Group related content:**
- Use clear, descriptive folder names
- Group by functionality, not file type
- Keep related concepts together

**Plan for growth:**
- Start simple, add structure as needed
- Leave room for new sections
- Consider how the project will evolve

**Think about maintenance:**
- Who will update each section?
- How often will different parts change?
- What's the review process?

### Templates You Can Copy ###

### Quick Start Templates

**Simple Project (3-5 sections):**
```
docs/
├── main.md
├── overview.md      # What it is
├── installation.md  # How to install
├── usage.md        # How to use
└── support.md      # Getting help
```

**Medium Project (6-10 sections):**
```
docs/
├── main.md
├── introduction/
│   └── overview.md
├── getting-started/
│   ├── installation.md
│   └── quick-start.md
├── guides/
│   ├── basic-usage.md
│   └── advanced-usage.md
└── reference/
    ├── troubleshooting.md
    └── faq.md
```

**Large Project (10+ sections):**
```
docs/
├── main.md
├── introduction/
├── getting-started/
├── user-guides/
├── tutorials/
├── reference/
└── community/
```

Pick the template that matches your current needs, then evolve it as your documentation grows!

## Best Practices ##

After working with hundreds of documentation projects, we've learned what makes Doculisp documentation successful. Follow these practices to create documentation that's easy to maintain, collaborate on, and navigate.

### File Organization ###

### Start with Clear Structure

**Use descriptive folder names that match your content:**

✅ **Good structure:**
```
docs/
├── getting-started/
├── user-guides/
├── api-reference/
├── troubleshooting/
└── community/
```

❌ **Confusing structure:**
```
docs/
├── stuff/
├── docs/          # Redundant
├── files/         # Vague
├── misc/          # Unclear
└── other/         # Unhelpful
```

### File Naming Conventions

**Be consistent and descriptive:**

✅ **Good file names:**
- `user-authentication.md`
- `api-endpoints.md`
- `deployment-guide.md`
- `troubleshooting-installation.md`

❌ **Poor file names:**
- `file1.md`
- `stuff.md`
- `document.md`
- `notes.md`

**Use hyphens, not spaces or underscores:**
- ✅ `getting-started.md`
- ❌ `getting_started.md`
- ❌ `getting started.md`

### Content Organization ###

### Organize Content by User Journey

**Think about how people will read your documentation:**

1. **Start with "why"** - What problem does this solve?
2. **Move to "how"** - Step-by-step instructions
3. **End with "what if"** - Troubleshooting and edge cases

**Example organization:**
```markdown
<!--
(dl
    (section-meta
        (title Complete Guide)
        (include
            (Why-Use-This ./introduction.md)        # Problem and solution
            (Getting-Started ./installation.md)     # Quick success
            (Getting-Started ./first-steps.md)      # Basic usage
            (User-Guide ./everyday-tasks.md)        # Common workflows
            (User-Guide ./advanced-features.md)     # Power user content
            (Reference ./troubleshooting.md)        # When things go wrong
            (Reference ./faq.md)                    # Common questions
        )
    )
)
-->
```

### Write Effective Section Names

**Make section names scannable and specific:**

✅ **Clear and specific:**
- `Installing on Windows`
- `Setting up Database Connections`
- `Common Error Messages`

❌ **Vague and unclear:**
- `Setup`
- `Configuration`
- `Issues`

### Writing Guidelines ###

### Keep Individual Files Focused

**Each file should have one clear purpose:**

✅ **Focused file:**
```markdown
<!-- (dl (section-meta Database Configuration)) -->

This section covers connecting to your database and configuring connection settings.

<!-- (dl (#connection-setup Connection Setup)) -->
<!-- (dl (#security-settings Security Settings)) -->
<!-- (dl (#performance-tuning Performance Tuning)) -->
```

❌ **Unfocused file:**
```markdown
<!-- (dl (section-meta Setup)) -->

This section covers database setup, email configuration, user management, and deployment.
```

### Use Consistent Header Patterns

**Establish a pattern and stick to it:**

✅ **Consistent pattern:**
```markdown
<!-- (dl (#overview Overview)) -->
<!-- (dl (#prerequisites Prerequisites)) -->
<!-- (dl (#step-by-step Step-by-Step Instructions)) -->
<!-- (dl (#verification Verification)) -->
<!-- (dl (#troubleshooting Troubleshooting)) -->
```

### Length Guidelines

**Optimal file lengths for readability:**

- **Individual sections:** 50-200 lines
- **Main files:** Focus on structure, minimal content
- **Tutorial files:** 100-300 lines
- **Reference files:** Can be longer, but break into subsections

### Collaboration Best Practices ###

### Team Workflow

**Assign clear ownership:**
```
docs/
├── getting-started/     # Owned by: Product team
├── developer-guide/     # Owned by: Engineering team
├── api-reference/       # Owned by: Backend team
├── design-system/       # Owned by: Design team
└── troubleshooting/     # Owned by: Support team
```

### Review Process

**Make documentation changes reviewable:**

1. **Small, focused changes** - One file or concept per pull request
2. **Clear commit messages** - "Update installation guide for Windows 11"
3. **Test compilation** - Always verify Doculisp compiles before merging
4. **Review for accuracy** - Have subject matter experts review their areas

### Version Control Tips

**Structure your commits for clear history:**

✅ **Good commit messages:**
- `Add troubleshooting section for database connections`
- `Update API examples to use new authentication method`
- `Fix broken links in getting started guide`

❌ **Poor commit messages:**
- `Update docs`
- `Fix stuff`
- `Changes`

### Maintenance Strategies ###

### Keep Documentation Current

**Build documentation updates into your workflow:**

**For software projects:**
- Update docs in the same pull request as code changes
- Include documentation review in your definition of done
- Set up automated checks to verify docs compile

**For ongoing projects:**
- Schedule quarterly documentation reviews
- Assign someone to watch for outdated content
- Keep a "documentation debt" list for improvements

### Regular Maintenance Tasks

**Monthly:**
- Check for broken links
- Verify installation instructions still work
- Update version numbers and screenshots

**Quarterly:**
- Review table of contents organization
- Look for sections that could be split or combined
- Check if examples are still relevant

**Annually:**
- Restructure based on user feedback
- Archive or remove outdated content
- Consider major organizational changes

### Performance and User Experience ###

### Optimize for Your Audience

**Know who's reading your documentation:**

**For beginners:**
- Start with simple examples
- Explain concepts progressively
- Include lots of context and explanation

**For experienced users:**
- Lead with quick reference
- Provide detailed examples
- Include edge cases and advanced scenarios

**For mixed audiences:**
- Use clear section titles to help people find what they need
- Separate basic and advanced content
- Provide multiple paths through the same information

### Table of Contents Strategy

**Make your TOC scannable:**

✅ **Scannable TOC groups:**
```doculisp
(include
    (Getting-Started ./installation.md)
    (Getting-Started ./first-steps.md)
    (Daily-Use ./common-tasks.md)
    (Daily-Use ./keyboard-shortcuts.md)
    (Advanced ./customization.md)
    (Advanced ./automation.md)
    (Help ./troubleshooting.md)
    (Help ./faq.md)
)
```

❌ **Unclear TOC groups:**
```doculisp
(include
    (Section-1 ./installation.md)
    (Section-2 ./first-steps.md)
    (Section-3 ./common-tasks.md)
    (Section-4 ./keyboard-shortcuts.md)
)
```

### Common Mistakes to Avoid ###

### Documentation Antipatterns

**Avoid these common problems:**

❌ **The Everything File** - One giant file that tries to cover everything
- Split into logical sections instead

❌ **The Orphan File** - Files that aren't included anywhere
- Every file should be linked from main document

❌ **The Stale Example** - Code examples that no longer work
- Keep examples simple and test them regularly

❌ **The Assumption Trap** - Assuming readers know things they don't
- Define terms and provide context

❌ **The Link Farm** - Just lists of links with no explanation
- Provide context and descriptions for external links

### Syntax and Style

**Consistent Doculisp patterns:**

✅ **Good label patterns:**
```doculisp
(include
    (Getting-Started ./basics.md)       # Descriptive
    (User-Guide ./workflows.md)         # Clear category
    (Reference ./api.md)                # Obvious purpose
)
```

❌ **Confusing label patterns:**
```doculisp
(include
    (Part-1 ./basics.md)               # Numbered sections
    (Documentation ./workflows.md)     # Redundant
    (File ./api.md)                    # Meaningless
)
```

### Testing and Validation ###

### Quality Assurance

**Always test your documentation:**

1. **Compile test** - Does Doculisp generate output without errors?
2. **Link test** - Do all internal and external links work?
3. **Example test** - Do code examples actually work?
4. **User test** - Can someone follow your instructions successfully?

### Automated Checks

**Set up simple automation:**
```bash
# In your build process
doculisp docs/main.md README.md
```

**Check file exists:**
```bash
# Make sure output was generated
if [ ! -f README.md ]; then
    echo "Documentation compilation failed"
    exit 1
fi
```

### Getting Feedback ###

### User Feedback

**Make it easy for users to improve your documentation:**

- Include contact information
- Set up a simple feedback mechanism
- Monitor support channels for documentation-related questions
- Ask new team members to follow your getting started guide

### Iterative Improvement

**Documentation is never finished:**

1. **Start simple** - Get something working first
2. **Gather feedback** - What confuses people?
3. **Iterate based on real usage** - Don't guess what people need
4. **Evolve your structure** - Reorganize as you learn more about your users

**Remember:** Perfect is the enemy of good. It's better to have good documentation that exists than perfect documentation that never gets written.

### Quick Checklist ###

### Pre-Publication Checklist

Before you compile and publish your documentation:

- [ ] File structure is logical and consistent
- [ ] File names are descriptive and use hyphens
- [ ] Each file has a clear, single purpose
- [ ] Table of contents groups make sense
- [ ] All include files exist and are referenced
- [ ] Headers use consistent ID naming
- [ ] Examples are current and tested
- [ ] Doculisp compiles without errors
- [ ] Generated output looks correct
- [ ] Links work correctly

Follow these practices and your documentation will be easier to maintain, more useful for your users, and more enjoyable for your team to work with!

## Troubleshooting ##

Running into issues with Doculisp? Don't worry – most problems have simple solutions. This section covers the most common issues and how to fix them.

### Installation Issues ###

### "Command not found" or "doculisp is not recognized"

**Problem:** You get an error saying `doculisp` command doesn't exist.

**Solution:**
1. **Check if Node.js is installed:**
   ```bash
   node --version
   ```

   If this fails, install Node.js from [nodejs.org](https://nodejs.org)

2. **Reinstall Doculisp:**
   ```bash
   npm install -g doculisp
   ```

3. **Check your PATH (Advanced):**
   - On Windows: Search for "Environment Variables" in Start menu
   - On Mac/Linux: Check if `~/.npm/bin` is in your PATH

**Still not working?** Try restarting your terminal or command prompt.

### Permission Errors During Installation

**Problem:** `npm install -g doculisp` fails with permission errors.

**Solutions:**

**On Mac/Linux:**
```bash
sudo npm install -g doculisp
```

**On Windows:**
- Run Command Prompt "as Administrator"
- Then run the install command

**Alternative (all platforms):**
Install without global flag and use npx:
```bash
npm install doculisp
npx doculisp main.md output.md
```

### Compilation Errors ###

### "File not found" Errors

**Problem:** Doculisp says it can't find a file you know exists.

**Common causes:**

1. **Wrong file path in include:**
   ```doculisp
   (include
       (Section ./subfolder/file.md)  # Check this path
   )
   ```

2. **Spaces in file names:**
   - ❌ `./my file.md`
   - ✅ `./my-file.md`

3. **Wrong working directory:**
   Make sure you're running doculisp from the correct folder.

**How to fix:**
1. Check file paths are relative to the main file
2. Verify files actually exist at those paths
3. Rename files to use hyphens instead of spaces

### Syntax Errors

**Problem:** Doculisp reports syntax errors in your files.

**Common syntax mistakes:**

❌ **Missing (dl marker:**
```markdown
<!-- (section-meta My Section) -->    # WRONG
```

✅ **Correct:**
```markdown
<!-- (dl (section-meta My Section)) --> # CORRECT
```

❌ **Quotation marks around parameters:**
```doculisp
(include
    ("Getting Started" ./start.md)     # WRONG
)
```

✅ **Correct:**
```doculisp
(include
    (Getting-Started ./start.md)       # CORRECT
)
```

❌ **Unmatched parentheses:**
```doculisp
(section-meta
    (title My Document               # Missing closing )
```

✅ **Correct:**
```doculisp
(section-meta
    (title My Document)              # Parentheses match
)
```

### Table of Contents Not Appearing

**Problem:** Your table of contents doesn't show up in the output.

**Check these things:**

1. **Is the content command present?**
   ```markdown
   <!-- (dl (content (toc))) -->
   ```

2. **Are you using Doculisp headers?**
   ```markdown
   <!-- (dl (#my-header My Header)) -->
   ```

   Regular markdown headers (`### My Header`) don't appear in Doculisp TOC.

3. **Is the main file structured correctly?**
   ```markdown
   <!--
   (dl
       (section-meta
           (title Document)
           (include ...)
       )
   )
   -->

   <!-- (dl (content (toc))) -->
   ```

### Output Problems ###

### Generated File Looks Wrong

**Problem:** The compiled markdown has formatting issues.

**Common issues:**

1. **Headers not numbered correctly:**
   - Make sure you're using Doculisp headers: `(#id Header Text)`
   - Check that header IDs are unique and lowercase

2. **Include sections in wrong order:**
   - Files are included in the order they appear in your include list
   - Reorder them in your main file to fix

3. **Missing content:**
   - Verify all included files have `(section-meta Name)` at the top
   - Check file paths are correct

### Empty Output File

**Problem:** Doculisp runs but generates an empty file.

**Check:**
1. **Main file has content:**
   ```markdown
   Some content here
   <!-- (dl (content (toc))) -->
   More content here
   ```

2. **Included files have content:**
   Each `.md` file should have actual content, not just section-meta.

3. **File permissions:**
   Make sure Doculisp can write to the output location.

### Performance Issues ###

### Slow Compilation

**Problem:** Doculisp takes a long time to compile your documentation.

**Possible causes:**
- Very large files (1000+ lines)
- Many include files (50+ files)
- Complex nested folder structure

**Solutions:**
1. **Break up large files** into smaller, focused sections
2. **Check for circular includes** (File A includes File B which includes File A)
3. **Simplify folder structure** if very deeply nested

### Out of Memory Errors

**Problem:** Doculisp crashes with memory errors.

**Solutions:**
1. **Increase Node.js memory:**
   ```bash
   node --max-old-space-size=4096 $(which doculisp) main.md output.md
   ```

2. **Break up large documents** into smaller files

3. **Check for infinite loops** in your include structure

### Debugging Strategies ###

### How to Debug Problems

**Step 1: Start Simple**
Create a minimal test case:
```markdown
<!-- (dl (section-meta Test)) -->
This is a test file.
```

**Step 2: Add Complexity Gradually**
- Add one include at a time
- Test after each addition
- Find exactly what causes the problem

**Step 3: Check the Basics**
- Are all files saved?
- Are you in the right directory?
- Do file paths match exactly?

**Step 4: Read Error Messages Carefully**
Doculisp error messages usually tell you:
- Which file has the problem
- What line number
- What type of error

### Test Your Syntax

**Create a simple test file:**
```markdown
<!--
(dl
    (section-meta
        (title Test Document)
        (include
            (Test ./test-section.md)
        )
    )
)
-->

This is my test content.

<!-- (dl (content (toc))) -->
```

**Create `test-section.md`:**
```markdown
<!-- (dl (section-meta Test Section)) -->

This is a test section.

<!-- (dl (#test-header Test Header)) -->

Some content under the header.
```

**Test compilation:**
```bash
doculisp test.md test-output.md
```

If this works, your Doculisp installation is fine and you can debug your actual documents.

### Common Error Messages ###

### Error Message Guide

**"Cannot find file"**
- Check file paths in your include statements
- Make sure files exist at those paths
- Verify you're running from the correct directory

**"Syntax error: unexpected token"**
- Check for unmatched parentheses
- Look for quotation marks around parameters
- Verify you have the `(dl` marker

**"Circular dependency detected"**
- File A includes File B which includes File A
- Check your include chains
- Draw a diagram if needed

**"Invalid header ID"**
- Header IDs must be lowercase
- Use hyphens instead of spaces
- IDs must be unique across the entire document

**"Section not found"**
- Check section-meta declarations
- Verify file is included in main document
- Check for typos in section names

### Getting More Help ###

### When You're Still Stuck

**Before asking for help, gather this information:**

1. **Your Doculisp version:**
   ```bash
   doculisp --version
   ```

2. **Your Node.js version:**
   ```bash
   node --version
   ```

3. **The exact error message** (copy and paste)

4. **Your file structure** (what files you have)

5. **A minimal example** that reproduces the problem

### Where to Get Help

1. **Check this troubleshooting guide** first
2. **Review the syntax guide** for correct patterns
3. **Create a simple test case** to isolate the problem
4. **Check the project's GitHub issues** for similar problems
5. **Create a new issue** with your system info and example

### Quick Fixes for Common Problems

**Problem:** Can't get table of contents to work
**Quick fix:** Use this exact pattern in your main file:
```markdown
<!-- (dl (content (toc (style numbered-labeled)))) -->
```

**Problem:** Headers aren't numbered
**Quick fix:** Use Doculisp headers instead of markdown:
```markdown
<!-- (dl (#my-id My Header)) -->
```

**Problem:** Include files don't appear
**Quick fix:** Make sure each file starts with:
```markdown
<!-- (dl (section-meta Section Name)) -->
```

**Problem:** Compilation fails
**Quick fix:** Check these in order:
1. All files saved?
2. File paths correct?
3. Syntax valid?
4. Running from right directory?

Most Doculisp problems are simple syntax or path issues. Take a step back, check the basics, and you'll usually find the solution quickly!

## Advanced Topics ##

Ready to take your Doculisp skills to the next level? This section covers advanced techniques for power users who want to get the most out of Doculisp.

### Project Files dlproj ###

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

### Pure Doculisp Files dlisp ###

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

### Advanced Organization Patterns ###

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

### Custom Table of Contents ###

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

### Linking and Cross-References ###

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

### Team Workflows ###

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

### Performance Optimization ###

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

### Extending Doculisp ###

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

### Quality Assurance ###

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

### Advanced Tips and Tricks ###

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

<!-- Written By: Jason Kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->