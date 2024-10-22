<!--
(dl
    (section-meta
        (title Content Block)
    )
)
-->

The content block signifies where to build the document from the included documents. This block has only one optional subblock.

<!-- (dl (# Table of Contents)) -->

The only subblock to the content block is the table of contents. This will cause a linked table of contents to appear for the section at its location.

The structure of the table of contents is `(toc)` there is an optional parameter that can have one of the following values, `labeled` is the default:

* no-table
* unlabeled
* labeled
* numbered
* numbered-labeled
* bulleted
* bulleted-labeled

Examples

```doculisp
(contents (toc))
```

```doculisp
(contents (toc bulleted-labeled))
```

Any of the options with `labled` on it will use the name of the subsection. 

```doculisp
(dl
    (file-meta
        (title Some Document)
        (include
            (chapter ./first) (*The title of this document is "An introduction")
        )
    )

    (content (toc bulleted-labeled))
)
```

The table of contents would contain a line that looked like:

```markdown
* Chapter: [An Introduction](#an-introduction)
```
