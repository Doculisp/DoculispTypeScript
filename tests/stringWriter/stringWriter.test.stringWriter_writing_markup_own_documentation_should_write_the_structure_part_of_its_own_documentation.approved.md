<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp (version 2.0.1) https://www.npmjs.com/package/doculisp -->

# Basic Structure #

The basic structure of Doculisp is all code is contained within blocks. A block is constructed within an HTML comment region. It starts with an open parentheses `(` followed by a sting of non-whitespace characters. This is called an atom. It then has 1 of three possibilities. It can have a parameter, a new block, or nothing. All blocks must close with a close parentheses `)`.

Even the Doculisp main block follows this.

Example

```markdown
<!--
(dl
    (section-meta
        (title Basic Structure)
    )
)
-->
```

The first block is the `dl` block. In it `dl` is the atom. It contains the `section-meta` sub-block.  That block has the atom `section-meta` followed by a further sub block. The last sub block is the `title` sub block. In it `title` is the atom and `Basic Structure` is the parameter.

## Parameter ##

A parameter is a string of characters that contains no line advancement (`\r` or `\n`) character and no parentheses (unless escaped). A parameter has a max length of 255 characters.

## Visual Explanation ##

```doculisp
(atom)
(atom parameter)
(atom (atom2))
(atom (atom2 second parameter))
```

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
