<!-- (dl (section-meta Best Practices)) -->

After working with hundreds of documentation projects, we've learned what makes Doculisp documentation successful. Follow these practices to create documentation that's easy to maintain, collaborate on, and navigate.

<!-- (dl (#file-organization File Organization)) -->

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

<!-- (dl (#content-organization Content Organization)) -->

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

<!-- (dl (#writing-guidelines Writing Guidelines)) -->

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

<!-- (dl (#collaboration-best-practices Collaboration Best Practices)) -->

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

<!-- (dl (#maintenance-strategies Maintenance Strategies)) -->

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

<!-- (dl (#performance-optimization Performance and User Experience)) -->

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

<!-- (dl (#common-mistakes Common Mistakes to Avoid)) -->

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

<!-- (dl (#testing-and-validation Testing and Validation)) -->

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

<!-- (dl (#getting-feedback Getting Feedback)) -->

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

<!-- (dl (#quick-checklist Quick Checklist)) -->

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
