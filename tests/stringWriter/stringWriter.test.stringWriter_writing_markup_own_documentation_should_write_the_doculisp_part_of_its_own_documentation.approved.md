<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp (version 1.2.3) https://www.npmjs.com/package/doculisp -->

# Doculisp Master Block #

All doculisp is contained in an outer doculisp block. That block starts with `(dl` followed by a white space. This doculisp block must be contained in an html comment.

Example

```markdown
<!--
(dl
    (section-meta
        (title Doculisp)
        (include
            (section ./doculisp.md)
        )
    )

    (content (toc numbered-labled))
)
-->
```

You will notice that in this example the doculisp contains 2 main blocks, however it is valid for the Doculisp block to contain more or less. Even zero other blocks.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
