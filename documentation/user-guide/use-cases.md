<!-- (dl (section-meta Common Use Cases)) -->

Let's explore real-world scenarios where Doculisp shines. These examples show you how to adapt Doculisp for different types of documentation projects.

<!-- (dl (#project-readme Open Source Project README)) -->

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

<!-- (dl (#user-manual Software User Manual)) -->

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

<!-- (dl (#research-paper Academic Research Paper)) -->

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

<!-- (dl (#team-knowledge-base Team Knowledge Base)) -->

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

<!-- (dl (#product-documentation Product Documentation)) -->

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

<!-- (dl (#api-documentation API Documentation)) -->

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

<!-- (dl (#choosing-your-structure Choosing Your Structure)) -->

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

<!-- (dl (#templates-to-copy Templates You Can Copy)) -->

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
