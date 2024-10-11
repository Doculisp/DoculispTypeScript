<!--
(dl
    (section-meta
        (title Using the Command Line Interface)
    )
)
-->

<!-- (dl (# To Install Doculisp)) -->

Run the following command: `npm i -g doculisp`

<!-- (dl (# Running the Doculisp compiler)) -->

If you run doculisp with the help option : `doculisp --help` you will see the following:

```
___  ____ ____ _  _ _    _ ____ ___
|  \ |  | |    |  | |    | [__  |__]
|__/ |__| |___ |__| |___ | ___] |

                     Version: N.N.N

Usage: doculisp [options]

A compiler for markdown

Options:
  -V, --version               output the version number
  -s, --source <source_path>  the source file to compile
  -d, --output <output_path>  the output document path for the compiled markdown
  -t, --test                  runs the compiler without generating the output file.
  -h, --help                  display help for command
```

The source and destination options are required.