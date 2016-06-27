# amd-ts

An implementation of the amd specification in typescript.

```html
<script type="text/javascript" src="./amd.js"></script>
<script type="text/javascript">

amd.ready(function() {
  // DOM is ready
})

amd.include(["./script1.js", "./script2.js"], function() {
  // non AMD modules loaded
})

amd.require(["./app", "./services"], function(app, services) { 
  // AMD modules loaded.
})

</script>

```
## overview

amd-ts is an implementation of the [asynchronous module definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) 
spec written in typescript. The library closely aligns with typescript AMD conventions but can be used to import
any AMD compatible javascript module. This libraries intent is to be a simple, zero configuration AMD loader with some additional
support for loading non AMD modules into the global scope for convenience.

amd-ts is offered as is, to be added to an existing typescript project or to be compiled and used as a out of the box AMD module loader.

## building from source

amd-ts requires the typescript compiler. The project can be build in the following way.
```
npm install typescript -g
node tasks build
```
alternatively..
```
tsc -p ./src/tsconfig.json --outFile ./bin/amd.js
```