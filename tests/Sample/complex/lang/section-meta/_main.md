<!--
(dl
    (section-meta
        (title Section Meta Block)
        (include
            (Section ./title.md)
            (Section ./ref-link.md)
            (Section ./subtitle.md)
            (Section ./include.md)
            (Section ./comments.md)
        )
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

<!-- (dl (content)) -->
