<!--
(dl
    (section-meta
        (title First Stage Parser)
        (subtitle The "Document" Parser)
    )
)
-->

The goal of these tests is to prove that Doculisp can accurately identify Doculisp code blocks from base Markdown. Where this is the primary goal, there is also a secondary goal to prove also. Doculisp needs to remove noisy whitespace. 

<!-- (dl (# General Functionality)) -->

The tests dealing with some of the basic general functionality are not contained in a `describe` block. These cover some of the basic failure modes.

<!-- (dl (# Parsing Markup)) -->

The first thing we verify is that we can identify basic Markup.

<!-- (dl (## Text)) -->

The most basic type of Markup is just raw text. These tests are the ones that verify that Doculisp can identify raw text as Markup.

<!-- (dl (## html comments)) -->

These tests veify that comment block can be identified and removed. The one tricky part of this, is html comments that appear in code blocks. We need to not remove these.

<!-- (dl (# Parsing .dlisp Files)) -->

Doculisp files are interesting because they do not contain any Markdown.

[back](<!-- (dl (get-path mains)) -->)<!-- this is a bad link. -->
