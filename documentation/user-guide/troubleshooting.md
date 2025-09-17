<!-- (dl (section-meta Troubleshooting)) -->

Running into issues with Doculisp? Don't worry – most problems have simple solutions. This section covers the most common issues and how to fix them.

<!-- (dl (#installation-issues Installation Issues)) -->

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

<!-- (dl (#compilation-errors Compilation Errors)) -->

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

<!-- (dl (#output-problems Output Problems)) -->

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

<!-- (dl (#performance-issues Performance Issues)) -->

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

<!-- (dl (#debugging-strategies Debugging Strategies)) -->

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

<!-- (dl (#common-error-messages Common Error Messages)) -->

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

<!-- (dl (#getting-help Getting More Help)) -->

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
