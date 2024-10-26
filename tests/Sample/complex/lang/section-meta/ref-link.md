<!-- (dl (section-meta Ref-Link)) -->

This is the first optional sub block for the `section-meta` block. The ref-link allows you to take over the link to use in the table of contents. Its main purpose is to handle characters in the title that markdown does not include in its section headers. This does not change the section link, but lets you specify a different link to use instead.

Example

```doculisp
(section-meta
    (title Doculisp is awesome ✨)
    (ref-link doculisp_is_awesome_)
)
```