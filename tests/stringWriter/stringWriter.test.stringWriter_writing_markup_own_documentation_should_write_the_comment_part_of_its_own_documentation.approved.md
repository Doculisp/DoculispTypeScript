<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->

# Comment Block #

The comment block is the only block that can be present at all levels within the Doculisp Main Block. The comment is created by adding an astrics `*` just after an open parenthisis and end when the block and all its subblocks are closed.

Example:

```markdown
<!--
(dl
    (*section-meta
        (title Doculisp)
        (include
            (section ./doculisp.md)
            (section ./section-meta.md)
            (section ./content.md)
            (section ./comment.md)
        )
    )
)
-->
```

In this example the `section-meta` block and all of its subblocks are commented out. Comments can also be nested. This allows you to uncomment in peices.

xample:

```markdown
<!--
(dl
    (*section-meta
        (title Doculisp)
        (*include
            (section ./doculisp.md)
            (section ./section-meta.md)
            (section ./content.md)
            (*section ./comment.md)
        )
    )
)
-->
```

## Nested Comments ##

In this example the `section-meta` and all its subblocks are commented out. However when you uncomment `section-meta` then the `include` block will be commented out. When you uncomment that block, then the `section ./comment.md` block will be commented out.

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->
