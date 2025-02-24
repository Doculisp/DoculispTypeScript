<!-- GENERATED DOCUMENT DO NOT EDIT! -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- Compiled with doculisp https://www.npmjs.com/package/doculisp -->
<!-- Written By: jason-kerney -->

# Doculisp #

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |
```

A Compiler for Doculisp Lang.

## Table of Contents ##

1. CLI: [Using the Command Line Interface](#using-the-command-line-interface)
2. Language: [Doculisp Language](#doculisp-language)
3. Project: [The Doculisp Project File](#the-doculisp-project-file)

## Using the Command Line Interface ##

### To Install Doculisp ###

To install the cli globally run the following command: `npm i -g doculisp`

To install the cli locally run the following command: `npm i doculisp --save-dev`

### Running the Doculisp compiler ###

If you have Doculisp installed globally then you can run `doculisp` from the command line.

If you have Doculisp installed locally then you can run `node ./node_modules/doculisp/dist/index.js` from the command line.

### Using the Doculisp compiler ###

If you run Doculisp with the help option : `doculisp --help` you will see the following:

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |

            Compiler Version: N.N.N
            Language Version: N.N.N

Usage: doculisp [options] [source] [output]

A compiler for markdown

Arguments:
  source         the path to the file to compile
  output         the path to the output location including output file name

Options:
  -V, --version  output the version number
  -t, --test     runs the compiler without generating the output file
  --update       updates doculisp
  -h, --help     display help for command
```

When using `--test` only the source path if mandatory.
When compiling both the source and destination are mandatory.

## Doculisp Language ##

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |
```

A language for Readme.

### Table of Contents ###

1. Version: [Language Version](#language-version)
2. Intro: [What Problem Does Doculisp Solve?](#what-problem-does-doculisp-solve)
3. Language: [Basic Structure](#basic-structure)
4. Language: [Doculisp Master Block](#doculisp-master-block)
5. Language: [Section Meta Block](#section-meta-block)
6. Language: [Content Block](#content-block)
7. Language: [Dynamic Headings](#dynamic-headings)
8. Language: [Comment Block](#comment-block)
9. Language: [Key Atoms by Depth](#key-atoms-by-depth)
10. Language: [Path Ids](#path-ids)
11. Language: [Dynamic Document Linking](#dynamic-document-linking)
12. Structure: [".dlisp" files](#dlisp-files)
13. Recognition: [Contributors ✨](#contributors-)

### Language Version ###

Doculisp version 1.2.1

### What Problem Does Doculisp Solve? ###

Doculisp is designed to solve one problem, making readme files easier to edit and maintain. With Doculisp you can break each read me into multiple smaller files. Every time you have a header or subheader that could be a new file. This allows for the task of documentation to be managed in parts. When a part of the documentation needs to be edited, you can open the file that pertains to that part, and only that part. There is a secondary advantage to this. Whe a change to the documentation happens, you can see what that change effected without looking at file diffs just by examining the files that changed.

#### A Word of Advice ####

If the text under a subheading is small, I would recommend  not breaking it into a different file. I actually recommend you start with a single readme, and refactor out to different files as the readme grows in size. Remember the point of this is to make updating and managing updates easier.

### Basic Structure ###

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

#### Parameter ####

A parameter is a string of characters that contains no line advancement (`\r` or `\n`) character and no parentheses (unless escaped). A parameter has a max length of 255 characters.

#### Visual Explanation ####

```doculisp
(atom)
(atom parameter)
(atom (atom2))
(atom (atom2 second parameter))
```

### Doculisp Master Block ###

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

### Section Meta Block ###

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

#### Title (required) ####

This is required, however it has two ways of being provided. The simple way, as a parameter to `section-meta`, or as a block if other blocks are also provided.

##### Simple Way #####

The simple way is to provide the title as a parameter to the `section-meta` block.

```doculisp
(section-meta Doculisp a Short Description)
```

##### Structured Way #####

If the `section-meta` block has any other sub blocks, then it is required that it also contains a `title` block. The title is followed by a title that ends at a `)`. Every thing following the white space after the word title and until a new line or a close parenthesis is the title.

```doculisp
(section-meta
    (title Doculisp How To)
    (subtitle A Short Description)
    (include
        (Section ./design.md)
    )
)
```

#### Ref-Link ####

This is the first optional sub block for the `section-meta` block. The ref-link allows you to take over the link to use in the table of contents. Its main purpose is to handle characters in the title that markdown does not include in its section headers. This does not change the section link, but lets you specify a different link to use instead.

Example

```doculisp
(section-meta
    (title Doculisp is awesome ✨)
    (ref-link doculisp_is_awesome_)
)
```

#### Subtitle ####

Subtitle creates a heading that is two levels of heading less then the title directly beneath the title.

#### Include ####

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

##### Subsections #####

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

#### Author ####

Author is an optional block in the section meta that puts the author's name in the comments at the top and bottom of the document. This block can be included multiple times and each will have a separate comment line.

```doculisp
(section-meta
    (title An example of the Author Block)
    (author Jason Kerney)
    (author Chris Stead)
)
```

#### Exception to the Rule ####

Comment block breaks this rule slightly. The astrict character is a special character that cause all atoms that start with to be treated as a comment, and all parameters and sub blocks to be ignored.

### Content Block ###

The content block signifies where to insert the compiled included documents. This block has only one optional subblock.

#### Table of Contents ####

The only subblock to the content block is the table of contents. This will cause a linked table of contents to appear for the section at its location.

##### Simple Usage #####

The simple usage of the table of contents is `(toc)` may have an optional bullet style as a parameter. The default style is `labeled`.

```doculisp
(content (toc numbered))
```

##### Complex Usage #####

The complex usage of table of contents allows you to specify an optional `label` that will appear as a heading directly above the table of contents. You can all so specify an optional `style` which will be a bullet style.

```doculisp
(content
    (toc
        (label Table of Contents)
        (style numbered)
    )
)
```

The default label will be not to include a label, and the default style is `labeled`

#### Bullet Style ####

The bullet style argument can have one of the following values:

* no-table
* unlabeled
* labeled
* numbered
* numbered-labeled
* bulleted
* bulleted-labeled

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

### Dynamic Headings ###

Sometimes you want to create structure aware headings such that only heading of lesser importance are under your title. this is accomplished by the `(#` block, or dynamic heading block.

The dynamic heading block works differently then other blocks. The number of `#` signs determine how far it is beneath the current sub/section heading.

Example

```markdown
<!--
(dl
    (section-meta
        (title Maths an intro)
        (include
            (section ./add.md)
            (section ./subtract.md)
            (section ./muliply.md)
            (section ./divide.md)
        )
    )
)
-->

<!-- (dl (# Summary)) -->

A cool summary of maths.

<!-- (dl (## Reasons For Document)) -->

An explanation why to have the document.


<!-- (dl (content (toc unlabled))) -->
```

If this example was the top level document, then the title of the document, Heading 1, would be "Maths an intro". "Summary" would then be created as a Heading 2, and  "Reasons For Document" as Heading 3.

However if this document represented a subsection directly under the Title, then "Maths an intro" would be Heading 2, "Summary" heading 3, and "Reasons For Document" would be Heading 4.

#### Max Heading Depth ####

Currently, the maximum heading depth recognized by Markdown is H6. However Doculisp will not restrict you to that depth. If the total depth is more then H6 you may get unexpected results.

### Comment Block ###

The comment block is the only block that can be present at all levels within the Doculisp Main Block. The comment is created by adding an astrics `*` just after an open parenthesis and end when the block and all its subblocks are closed.

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

In this example the `section-meta` block and all of its subblocks are commented out. Comments can also be nested. This allows you to uncomment in pieces.

Example:

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

#### Nested Comments ####

In this example the `section-meta` and all its subblocks are commented out. However when you uncomment `section-meta` then the `include` block will be commented out. When you uncomment that block, then the `section ./comment.md` block will be commented out.

### Key Atoms by Depth ###

Here is a list of all the key atoms by depth:

* markdown
* `dl`
  * `section-meta`
    * `title` text
      * `*`
    * `subtitle` text
      * `*`
    * `ref-link` text
      * `*`
    * `include`
      * name
      * file path
      * `*`
    * `reference`
      * `file`
        * `id` text
        * `source` file path
        * `target` file path
    * `*`
  * `content`
    * `toc` bullet style
       * `label` label text
       * `style` bullet style
  * `#` text
  * `*`
* `*`

### Path Ids ###

#### What are Path Ids? ####

Path Ids are a way to create a link to a document or a part of a document without knowing what the final path will be. This allows the final path to change, either by changing the output location, or by simply taking a subsection and turning it into a separate document. It also relieves the burden of the author of having to correctly type the path, and allowing them instead to focus on what they want to link to.

How to use document Ids to create links is [given later](#dynamic-document-linking) within this document.

There are a couple of ways to define path ids based on what you want to identify.

#### Section Meta Ids ####

The first place that a path id can be included is within a `section-meta` block. It is added though the use of an `id` block.

##### Section Id #####

The Id block is an optional block. It allows you to set an id for the section.

##### Example #####

```doculisp
<!--
example.md
(dl
(section-meta
    (title An Example of an ID)
    (id my-id)
)
)
-->
```

#### Dynamic Heading Ids ####

You can add an Id to a heading by following the hash-mark (`#`) with your id.

###### Example ######

```doculisp
<!-- info.md -->
<!-- (dl (#heading-id Information About Heading Ids)) -->

Some text here.
```

#### Id Requirements ####

The id block must meet the following requirements:

* It must be lowercase.
* It must not contain any symbols other then underscore `_` or hyphen `-`.
* It must be globally unique.

### Dynamic Document Linking ###

You can convert ids to link text that will link to the file and appropriate header if used from outside of the file, and become a header link only when used within in the file.

```doculisp
(get-path id)
```

This will return the path needed to get to the document / header combination. This would best be used in a link as follows:

```md
[Main Document](<!-- (dl (get-path main)) -->)
```

In the above example you will have link to correct document and the correct heading.

### ".dlisp" files ###

If you have a file that contains only Doculisp code blocks without any markdown you can simplify that file. By changing the extension from `.md` to `.dlisp` you can remove the html comments and the opening `(dl` to contain raw Doculisp code.

#### Example ####

```markdown
<!--
(dl
    (section-meta
        (title Doculisp)
        (include
            (Version ./version.md)
            (Intro ./why.md)
            (Language ./structure.md)
            (Recognition ./contributors.md)
        )
    )
)
-->

<!-- (dl (# Table of Contents)) -->

<!-- (dl (content (toc))) -->
```

Can be simplified to:

```doculisp
(section-meta
    (title Doculisp)
    (include
        (Version ./version.md)
        (Intro ./why.md)
        (Language ./structure.md)
        (Recognition ./contributors.md)
    )
)

(# Table of contents)

(content (toc))
```

### Contributors ✨ ###

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

I want to give a special thanks to my friend [Chris Stead](https://github.com/cmstead) who wrote [Book Lisp](https://github.com/cmstead/booklisp) which was a huge insperation for this tool.

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.chrisstead.net/"><img src="https://avatars.githubusercontent.com/u/4184510?v=4?s=100" width="100px;" alt="Chris Stead"/><br /><sub><b>Chris Stead</b></sub></a><br /><a href="#ideas-cmstead" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
  </tbody>
</table>

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## The Doculisp Project File ##

### Table of Contents ###

1. [What is a Doculisp Project File](#what-is-a-doculisp-project-file)
2. [The Documents Block](#the-documents-block)

### What is a Doculisp Project File ###

The Doculisp project file is a way to compile multiple Doculisp documents with a single command. It is intended to allow related documents to be compiled together and at once easily. This could be the readme and contrib documents, or any other collection of similar documents.

The project file _**MUST**_ have the extension of `.dlproj`. It also cannot be used in the `include` block as it does not represent a single document but instead a collection of related documents.

The contents of the the project file is structured using lisp, similar to any other part of Doculisp.

### The Documents Block ###

The `documents` block is the only root level block in the project file. It is also only allowed once in the file. Everything else is contained within.

```doculisp
(* myProject.dlproj)
(documents
)
```

#### The Document Block ####

The `document` block has the information needed to build a single document. This represents the input usually passed to the compiler, plus some optional additional information.

##### The Source Block #####

The `source` block contains the path to the source file to compile. This can be either have a `.md` extension or the `.dlisp` extension. This is a required block.

##### The Output Block #####

The `output` block contains the path to the resulting markdown file. This must have the `.md` extension. This is a required block.

##### A simple example #####

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

##### The Document Identifier Block #####

The document identifier block is a very different kind of block. It is an optional block that surrounds the `source` and `output` blocks. It can have any character combination, without spaces, as its command name. It works similar to the subsection block in this regard. Its purpose is to give a simple identifier to the document. Every identifier name must be unique within the project file.

If this block is contained within the `document` block then it is the only block that is a child of the `documents` block.

The document identifier block is used to create a dynamic link to the document from other any compiled document.

###### Restrictions ######

The document identifier must meet the following restrictions:

* Document identifier must be lowercase.
* Document identifier must not contain any symbols other then underscore `_` or hyphen `-`.

###### Document Identifier Example ######

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