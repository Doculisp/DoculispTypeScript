<!-- Generated Document do not edit! -->

# An explanation of the tests #

1. [Section: Parser Tests](#parser-tests)

## Parser Tests ##

#### The meat of the testing ####

Most of the work is done in the parsers. They take an input document and follow these basic steps:

1. Separate Doculisp from Markdown
2. Tockenize the parts of Doculisp
3. Recombine Markdown and Doculisp in a syntactic tree that represents the final document.
4. Repeate steps 1 through 4 with all include documents.

These test prove all of the above.

[Subsection: First Stage Parser](#first-stage-parser)

### First Stage Parser ###

##### The "Document" Parser #####

The goal of these tests is to prove that Doculisp can accurately identify Doculisp code blocks from base Markdown. Where this is the primary goal, there is also a secondary goal to prove also. Doculisp needs to remove noisy whitespace.

#### General Functionality ####

The tests dealing with some of the basic general functionality are not contained in a `describe` block. These cover some of the basic failure modes.

#### Parsing Markup ####

The first thing we verify is that we can identify basic Markup.

##### Text #####

The most basic type of Markup is just raw text. These tests are the ones that verify that Doculisp can identify raw text as Markup.

##### html comments #####

These tests veify that comment block can be identified and removed. The one tricky part of this, is html comments that appear in code blocks. We need to not remove these.

#### Parsing .dlisp Files ####

Doculisp files are interesting because they do not contain any Markdown.

<!-- Generated Document do not edit! -->
