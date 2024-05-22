<!--
(dl
    (section-meta
        (title Dynamic Headings)
    )
)
-->

Sometimes you want to create structure aware headings such that only heading of lesser importance are under your title. this is accomplished by the `(#` block, or dynamic headinlg block.

The dynamic heading block works differently then other blocks. The number of `#` signs determins how far it is beneith the current sub/section heading.

Example

```markdown
<!--
(dl
    (section-meta
        (title Maths an intro)
        (external
            (section ./add.md)
            (section ./subtract.md)
            (section ./muliply.md)
            (section ./divide.md)
        )
    )
)
-->

<!-- (# Summary) -->

A cool summary of maths.

<!-- (## Resons For Document) -->

An explination why to have the document.


<!-- (dl (content (toc unlabled))) -->
```

If this example was the top level document, then the title of the document, Heading 1, would be "Maths an intro". "Summray" would then be created as a Heading 2, and  "Resons For Document" as Heading 3.

However if this document reprended a subsection directly under the Title, then "Maths an intro" would be Heading 2, "Summary" heading 3, and "Reasons For Document" would be Heading 4.

<!-- (# Max Heading Depth) -->

Currently, the maximum heading depth recognized by Markdown is H6. However Doculisp will not restrict you to that depth. If the total depth is more then H6 you may get unexpected results.