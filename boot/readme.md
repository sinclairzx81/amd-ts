# amd bundle bootstrapper

This directory provides a set of AMD module wrappers that enable a AMD bundle produced 
by the typescript compiler to be consumed in non AMD environments. 

developed against typescript 1.8.10

## rational

As of writing, the typescript compiler doesn't support compiling for both modular and non-modular targets, forcing
the developer to choose one over the other. 

In most scenarios, developers are likely to have a module system in place, but in some cases, 
being able to compile library code as a AMD module AND as a standalone script file (included with 
a &lt;script&gt; tag) is a nice option for end users. 

For the developer, being able to leverage and normalize modules with the import / export 
keywords (vs the use of triple slash reference directives) and still be able to produce a
output script that can be included with a &lt;script&gt; is a nice option to have. 

As of writing, the typescript compilers bundled AMD output provides just enough
of a shell for standalone wrapping. These wrappers build around it.

## typescript compile targets

both of these wrappers are built over typescript AMD modules compiled with the --outFile switch. An example
would be.

```
tsc ./app/index.ts --module AMD --target ES5 --outFile ./app.js
```
This has the compiler emit a single bundled AMD module. The templates in this directory can
wrap this output, making that bundle accessible as both a commonjs module AND a standalone 
script file.

## how do these wrappers work

Each wrapper implements a mini AMD loader that acts as a bootstrapper for the bundled 
AMD module. Users wrapping the module will need to compile their project bundled with
the --outFile switch, and manually insert (copy or paste if need be) their compiled module
into the wrapper.

The wrappers themselves contain comments on where the bundle should be inserted.
 




