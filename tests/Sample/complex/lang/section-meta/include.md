<!--
(dl
    (section-meta
        (title Include)
    )
)
-->

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


<!-- (dl (# Subsections)) -->

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