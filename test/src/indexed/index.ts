import * as mod0 from "./mod0"
import * as mod1 from "./mod1"
import * as mod2 from "./mod2"

declare var log: any

export function test() {
  log("indexed: index")
  mod0.test()
  mod1.test()
  mod2.test()
}