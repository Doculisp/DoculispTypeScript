<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: jason-kerney -->

# The Doculisp Project File #

## Table of Contents ##

1. [What is a Doculisp Project File](#what-is-a-doculisp-project-file)
2. [The Documents Block](#the-documents-block)

## What is a Doculisp Project File ##

The Doculisp project file is a way to compile multiple Doculisp documents with a single command. It is intended to allow related documents to be compiled together and at once easily. This could be the readme and contrib documents, or any other collection of similar documents.

The project file _**MUST**_ have the extension of `.dlproj`. It also cannot be used in the `include` block as it does not represent a single document but instead a collection of related documents.

The contents of the the project file is structured using lisp, similar to any other part of Doculisp.

## The Documents Block ##

The `documents` block is the only root level block in the project file. It is also only allowed once in the file. Everything else is contained within.

```doculisp
(* myProject.dlproj)
(documents
)
```

### The Document Block ###

The `document` block has the information needed to build a single document. This represents the input usually passed to the compiler, plus some optional additional information.

#### The Source Block ####

The `source` block contains the path to the source file to compile. This can be either have a `.md` extension or the `.dlisp` extension. This is a required block.

#### The Output Block ####

The `output` block contains the path to the resulting markdown file. This must have the `.md` extension. This is a required block.

#### A simple example ####

```doculisp
(* myproject.dlprog)
(documents
    (document
        (source ./readme/readme.md)
        (output ../README.md)
    )
    (document
        (output ../contrib.md)
        (source ./contrib/how_to.md)
    )
)
```

#### The Document Identifier Block ####

The document identifier block is a very different kind of block. It is an optional block that surrounds the `source` and `output` blocks. It can have any character combination, without spaces, as its command name. It works similar to the subsection block in this regard. Its purpose is to give a simple identifier to the document. Every identifier name must be unique within the project file.

If this block is contained within the `document` block then it is the only block that is a child of the `documents` block.

The document identifier block is used to create a dynamic link to the document from other any compiled document.

##### Restrictions #####

The document identifier must meet the following restrictions:

* Document identifier must be lowercase.
* Document identifier must not contain any symbols other then underscore `_` or hyphen `-`.

##### Document Identifier Example #####

```doculisp
(* myproject.dlprog)
(documents
    (document
        (readme
            (source ./readme/readme.md)
            (output ../README.md)
        )
    )
    (document
        (contrib
            (output ../contrib.md)
            (source ./contrib/how_to.md)
        )
    )
)
```

<!-- Written By: jason-kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->