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

1. Resources: [Other Resources](#other-resources)
2. CLI: [Using the Command Line Interface](#using-the-command-line-interface)

## Other Resources ##

* [Language Documentation](./LANG.md)
* [Project File Format](./PROJECT.md)

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

<!-- Written By: jason-kerney -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- GENERATED DOCUMENT DO NOT EDIT! -->