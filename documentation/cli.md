<!--
(dl
    (section-meta
        (title Using the Command Line Interface)
    )
)
-->

<!-- (dl (# To Install Doculisp)) -->

To install the cli globally run the following command: `npm i -g doculisp`

To install the cli locally run the following command: `npm i doculisp --save-dev`

<!-- (dl (# Running the Doculisp compiler)) -->

If you have Doculisp installed globally then you can run `doculisp` from the command line.

If you have Doculisp installed locally then you can run `node ./node_modules/doculisp/dist/index.js` from the command line.

<!-- (dl (# Using the Doculisp compiler)) -->

If you run Doculisp with the help option : `doculisp --help` you will see the following:

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |

            Compiler Version: 2.0.1
            Language Version: 0.1.0

Usage: doculisp [options] [source] [output]

A compiler for markdown

Arguments:
  source         the path to the file to compile
  output         the path to the output location including output file name

Options:
  -V, --version  output the version number
  -t, --test     runs the compiler without generating the output file
  --update       updates the global install of doculisp
  -h, --help     display help for command
```

When using `--test` only the source path if mandatory.
When compiling both the source and destination are mandatory.