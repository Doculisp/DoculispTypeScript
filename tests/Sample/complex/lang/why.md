<!--
(dl
    (section-meta
        (title What Problem Does Doculisp Solve?)
        (ref-link what-problem-does-doculisp-solve)
    )
)
-->

Doculisp is designed to solve one problem, making readme files easier to edit and maintain. With Doculisp you can break each read me into multiple smaller files. Every time you have a header or subheader that could be a new file. This allows for the task of documentation to be managed in parts. When a part of the documentation needs to be edited, you can open the file that pertains to that part, and only that part. There is a secondary advantage to this. Whe a change to the documentation happens, you can see what that change effected without looking at file diffs just by examining the files that changed.

<!-- (dl (# A Word of Advice)) -->

If the text under a subheading is small, I would recommend  not breaking it into a different file. I actually recommend you start with a single readme, and refactor out to different files as the readme grows in size. Remember the point of this is to make updating and managing updates easier.