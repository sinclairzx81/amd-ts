import * as inside  from "./inside"
import * as outside from "./outside"

declare var log: any;

export function test() {
  log("error: test")
  inside.test()
  outside.test()
}