# Feature TODO List

This document tracks feature requests and improvements for Doculisp.

## Code Block Handling Improvements

### Enhanced Backtick Support

**Current Issue:**
Doculisp currently only recognizes 3-backtick (```) code blocks. This creates problems when trying to document markdown that contains nested code blocks, as there's no way to escape or use alternative fence lengths.

**Specific Problem Encountered:**
When creating documentation that shows markdown examples containing bash code blocks, we get conflicts:

```markdown
<!-- This doesn't work in Doculisp -->
````markdown
Basic usage examples:

```bash
my-project input.txt output.txt
```
````
```

**Current Workaround:**
Use indented code blocks instead of fenced code blocks for inner examples:

```markdown
<!-- This works but loses syntax highlighting -->
```markdown
Basic usage examples:

    my-project input.txt output.txt
    my-project --help
```
```

### Proposed Solutions

#### Option 1: Support Multiple Backtick Lengths
Support 4, 5, 6+ backtick code fences following the CommonMark specification:

- `````markdown` (5 backticks) can contain ````markdown` (4 backticks)
- ````markdown` (4 backticks) can contain ```bash` (3 backticks)
- ```bash` (3 backticks) can contain inline code with single backticks

**Benefits:**
- Follows CommonMark standard
- Enables proper nesting of code examples
- Maintains syntax highlighting at all levels
- Compatible with most markdown parsers

**Implementation Notes:**
- Update tokenizer to recognize variable-length backtick sequences
- Ensure closing fence matches opening fence length exactly
- Test with various nesting scenarios

#### Option 2: Alternative Fence Characters
Support tilde (`~`) fences as an alternative to backticks:

```markdown
~~~markdown
```bash
echo "hello world"
```
~~~
```

**Benefits:**
- Provides immediate alternative for nesting
- CommonMark compliant
- Easy to implement alongside existing backtick support

#### Option 3: Escape Sequences
Provide escape mechanisms for backticks within code blocks:

```markdown
```markdown
\```bash
echo "hello world"
\```
```
```

**Benefits:**
- Minimal parser changes
- Explicit control over escaping

**Drawbacks:**
- Non-standard approach
- May confuse users familiar with CommonMark

### Priority Assessment

**High Priority:**
- [ ] Support 4+ backtick code fences (Option 1)
- [ ] Update documentation with examples of nested code blocks

**Medium Priority:**
- [ ] Support tilde (`~`) fences (Option 2)
- [ ] Add validation for proper fence matching

**Low Priority:**
- [ ] Custom escape sequences (Option 3)

### Testing Requirements

When implementing enhanced backtick support:

1. **Basic Functionality:**
   - [ ] 4-backtick fences work correctly
   - [ ] 5-backtick fences work correctly
   - [ ] 6+ backtick fences work correctly

2. **Nesting Scenarios:**
   - [ ] 4-backticks containing 3-backticks
   - [ ] 5-backticks containing 4-backticks containing 3-backticks
   - [ ] Mixed language specifications (markdown, bash, javascript, etc.)

3. **Error Handling:**
   - [ ] Unmatched fence lengths produce clear error messages
   - [ ] Unclosed fences are detected and reported
   - [ ] Invalid fence characters are handled gracefully

4. **Backward Compatibility:**
   - [ ] Existing 3-backtick fences continue to work
   - [ ] No breaking changes to current syntax
   - [ ] Performance impact is minimal

### Related Issues

- **Documentation Quality:** Better code block support would significantly improve documentation examples
- **User Experience:** Reduces need for workarounds and maintains proper syntax highlighting
- **Standards Compliance:** Aligns Doculisp with CommonMark specification

### Implementation Timeline

**Phase 1:** Research and Design
- [ ] Study CommonMark spec for fence handling
- [ ] Design tokenizer changes
- [ ] Plan backward compatibility strategy

**Phase 2:** Core Implementation
- [ ] Update tokenizer for variable-length fences
- [ ] Modify AST structures as needed
- [ ] Update string writer for proper output

**Phase 3:** Testing and Documentation
- [ ] Comprehensive test suite
- [ ] Update user documentation
- [ ] Real-world testing with complex examples

**Phase 4:** Release
- [ ] Version bump with feature announcement
- [ ] Migration guide for existing projects
- [ ] Community feedback integration

---

## Other Feature Ideas

### Enhanced Include Patterns
- [ ] Glob pattern support for includes
- [ ] Conditional includes based on variables
- [ ] Directory-based auto-includes

### Variable System Improvements
- [ ] Environment variable support
- [ ] Date/time variables
- [ ] Computed variables

### Output Format Extensions
- [ ] HTML output support
- [ ] PDF generation pipeline
- [ ] Custom template system

---

*Last Updated: September 16, 2025*
*Next Review: When implementing backtick improvements*