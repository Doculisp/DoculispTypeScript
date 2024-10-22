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

            Compiler Version: n.n.n
            Language Version: n.n.n

Usage: doculisp [options] <source> <output>

A compiler for markdown

Arguments:
  source         the path to the file to compile   
  output         the path to the output location including output file name   
  
Options:
  -V, --version  output the version number  
  -t, --test     runs the compiler without generating the output file  
  -h, --help     display help for command  
```  

The source and destination options are required.