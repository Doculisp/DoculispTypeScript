<!--
(dl
    (section-meta
        (title Parser Tests)
        (subtitle The meat of the testing)
        (external
            (Subsection ./document.md) (* where all parsing starts)
            (*Subsection ./tokenizer.md) (* Building semantic information about key words.)
            (*Subsection ./ast.md) (* Turning tokens into Abstract Syntax Trees.)
            (*Subsection ./astBuilder.md) (*Building external document Abstract Syntax Trees.)
        )
    )
)
-->

Most of the work is done in the parsers. They take an input document and follow these basic steps:

1. Separate Doculisp from Markdown
2. Tockenize the parts of Doculisp
3. Recombine Markdown and Doculisp in a syntactic tree that represents the final document.
4. Repeate steps 1 through 4 with all external documents.

These test prove all of the above.

<!-- (dl (content (toc))) -->