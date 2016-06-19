declare var log: any

import * as mod0 from "./mod0/mod"
import * as mod1 from "./mod1/mod"
import * as mod2 from "./mod2/mod"

export function test() {
  log("indexed_dir: index")
  mod0.test()
  mod1.test()
  mod2.test()
}