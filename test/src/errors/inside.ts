declare var log           : any
declare var __undefined   : any

export function test() {
  log("error-inside: test")
  __undefined("should error")
}