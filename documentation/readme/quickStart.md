<!-- (dl (section-meta Get Started)) -->

Get up and running with Doculisp in just 5 minutes! 

<!-- (dl (# What is Doculisp?)) -->

Doculisp solves the **documentation maintenance problem**. Instead of managing one massive README file, you can break it into smaller, focused files that are easier to edit, review, and collaborate on.

**Before Doculisp:** One huge README.md file with merge conflicts  
**After Doculisp:** Multiple small, focused files with clean collaboration

<!-- (dl (# Quick Start)) -->

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

<!-- (dl (# Next Steps)) -->

For comprehensive tutorials, examples, and best practices, see the [User Guide](<!-- (dl (get-path user-guide)) -->).