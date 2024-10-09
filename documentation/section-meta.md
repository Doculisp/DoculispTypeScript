<!--
(dl
    (section-meta
        (title Section Meta Block)
    )
)
-->

This block is contained directly within the Doculisp main block. It contains information used to build the current secion. This includes things like title, subtitle, and include.

Example

```doculisp
(section-meta
    (title Doculisp a short description)
    (include
        (section ./doculisp.md)
    )
)
```

<!-- (dl (# Title \(required\))) -->

This is the only sub block required for the `section-meta` block. The title is followed by a title that ends at a `)`. Every thing following the white space after the word title and until a new line or a close parenthesis is the title.

<!-- (dl (# Ref-Link)) -->

This is the first optional sub block for the `section-meta` block. The ref-link allows you to take over the link to use in the table of contents. Its main purpose is to handle characters in the title that markdown does not include in its section headers. This does not change the section link, but lets you specify a different link to use instead.

Example

```doculisp
(section-meta
    (title Doculisp is awesome ✨)
    (ref-link doculisp_is_awesome_)
)
```

<!-- (dl (# Subtitle)) -->

Subtitle creates a heading that is two levels of heading less then the title directly beneath the title.

<!-- (dl (# Include)) -->

This allows you to break each section up into sub-sections that are composed in seperate files. This allows you to limit the scope of work in each file making it easier to find where you need to edit and focus on a single idea.

Example

```doculisp
(section-meta
    (title Doculisp a short description)
    (include
        (section ./doculisp.md)
        (section ./section-meta.md)
    )
)
```

<!-- (dl (## Sub-Sections)) -->

The `include` block is composed of sub-section blocks. These blocks are different then other doculisp blocks. They are custom named blocks. Which means the name of each block is decided by the programmer the same way a variable name is. The format of these blocks is `(` followed by a name followed by whitespace. After the white space is the file path that leads to the document containing the information on how to build the sub-section. Followed again by an optional new line and whitespace. Ending in `)`.

You can add a space (` `) to a name by adding a `-` to the name.

Example

```doculisp
(include
    (chapter
        ./information/one.md
    )
)
```

This will create a sub-section called `chapter` that is built using the file `./information/one.md`.

Example

```doculisp
(include
    (sub-section ./one.md)
)
```

This will create a subsection called `sub section` that is built using the file `./one.md`.

```doculisp
(include (section ./two.md))
```

This will create a subsection called `section` that is built using the file `./two.md`.

<!-- (dl (# Exception to the Rule)) -->

Comment block breaks this rule slightly. The astrict character is a special character that cause all atoms that start with to be treated as a comment, and all parameters and sub blocks to be ignored.
