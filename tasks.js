//--------------------------------------------------
// amd-ts
//--------------------------------------------------

"use strict";

const tasks = require("./tasksmith.js")

//--------------------------------------------------
// installs build environment.
//--------------------------------------------------
const install = () => tasks.series([
  tasks.shell("npm install typescript -g"),
])

//--------------------------------------------------
// cleans up build directories.
//--------------------------------------------------
const clean = () => tasks.series([
  tasks.trycatch(() => tasks.drop("./bin"),      () => tasks.ok("can't drop ./bin .. oh well..")),
  tasks.trycatch(() => tasks.drop("./test/bin"), () => tasks.ok("can't drop ./test/bin")),
  tasks.ok("clean!")
])

//--------------------------------------------------
// builds the AMD module bootstrappers.
//--------------------------------------------------
let amd_insert_bundle_string = `
//--------------------------------------------
// INSERT AMD BUNDLE HERE
//--------------------------------------------
`
const build_bootstrap = () => tasks.series([
  tasks.shell ("tsc ./boot/bootstrap.ts  --removeComments --outFile ./boot/bootstrap.js"),
  tasks.concat("./boot/commonjs.js", ["./boot/bootstrap.js"]),
  tasks.append("./boot/commonjs.js",   amd_insert_bundle_string),
  tasks.append("./boot/commonjs.js", "\nmodule.exports = collect();"),
  tasks.concat("./boot/standalone.js", []),
  tasks.append("./boot/standalone.js", "\nvar modulename = (function() {\n"),
  tasks.concat("./boot/standalone.js", ["./boot/standalone.js", "./boot/bootstrap.js"]),
  tasks.append("./boot/standalone.js", amd_insert_bundle_string),
  tasks.append("./boot/standalone.js", "\nreturn collect(); \n})()"),
  tasks.drop  ("./boot/bootstrap.js")

])
//--------------------------------------------------
// builds all projects.
//--------------------------------------------------
const build = () => tasks.series([
  tasks.shell("tsc -p ./src/tsconfig.json --outFile ./bin/amd.js"),
  tasks.concat("./bin/amd.js",   ["./license", "./bin/amd.js"]),
  tasks.concat("./bin/amd.d.ts", ["./license",  "./bin/amd.d.ts"])
])

//--------------------------------------------------
// sets up the browser tests on port 5000
//--------------------------------------------------
const watch = () => tasks.parallel([
  tasks.shell("tsc -w -p ./src/tsconfig.json  --outFile  ./test/amd/amd.js"),
  tasks.shell("tsc -w -p ./test/tsconfig.json --outFile ./test/bin/bundle/app.js"),
  tasks.shell("tsc -w -p ./test/tsconfig.json --outDir  ./test/bin/standard"),
  tasks.serve("./test", 5000, true, 1000)
])

//--------------------------------------------------
// mini cli.
//--------------------------------------------------
const cli = tasks.cli(process.argv, {
  "install"         : install(),
  "clean"           : clean(),
  "build-bootstrap" : build_bootstrap(),
  "build"           : build(),
  'watch'           : watch()
})

cli.subscribe(event => {
  console.log(tasks.format(event))
}).run()

