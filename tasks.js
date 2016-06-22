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
  tasks.shell("npm install serve -g")
])

//--------------------------------------------------
// cleans up build directories.
//--------------------------------------------------
const clean = () => tasks.series([
  tasks.drop("./bin"),
  tasks.drop("./test/bin")
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
  tasks.shell("tsc -w -p ./src/tsconfig.json --outFile  ./test/amd/amd.js"),
  tasks.shell("tsc -w -p ./test/tsconfig.json --outFile ./test/bin/bundled/app.js"),
  tasks.shell("tsc -w -p ./test/tsconfig.json --outDir  ./test/bin/normalized"),
  tasks.shell("starting test on port 5000", "cd test && serve -p 5000")
])

//--------------------------------------------------
// mini cli.
//--------------------------------------------------
const cli = tasks.cli(process.argv, {
  "install" : install(),
  "clean"   : clean(),
  "build"   : build(),
  'watch'   : watch()
})

cli.subscribe(event => {
  console.log(tasks.format(event))
}).run()

