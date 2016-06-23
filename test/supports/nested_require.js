define(["require"], function(require) {
  log("inside top level require.")
  require("./supports/exports_on_return", function(mod) {
    log("inside sub level require..")
    log(mod)
  }).catch(function(error) { log(error) })
})