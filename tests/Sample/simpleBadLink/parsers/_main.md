<!--
(dl
    (section-meta
        (title Parser Tests)
        (subtitle The meat of the testing)
        (include
            (Subsection ./document.md) (* where all parsing starts)
            (*Subsection ./tokenizer.md) (* Building semantic information about key words.)
            (*Subsection ./doculisp.md) (* Turning tokens into Abstract Syntax Trees.)
            (*Subsection ./astBuilder.md) (*Building include document Abstract Syntax Trees.)
        )
        (id main)
    )
)
-->

Most of the work is done in the parsers. They take an input document and follow these basic steps:

1. Separate Doculisp from Markdown
2. Tockenize the parts of Doculisp
3. Recombine Markdown and Doculisp in a syntactic tree that represents the final document.
4. Repeate steps 1 through 4 with all include documents.

These test prove all of the above.

<!-- (dl (content (toc))) -->