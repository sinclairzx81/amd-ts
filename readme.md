# amd-ts

An implementation of the amd specification in typescript.

```html
<script type="text/javascript" src="./amd.js"></script>
<script type="text/javascript">
amd.require("./app", function(app) { 
  app.dostuff()
})
</script>
```
## overview

amd-ts is a implementation of the [asynchronous module definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) 
spec written in typescript. The library closely aligns with the typescript AMD module conventions but can be used to require
any AMD compatible javascript module.

amd-ts is offered as is, to be added to an existing typescript project or to be compiled and used as a traditional AMD module importer.

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