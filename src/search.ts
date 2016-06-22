/*--------------------------------------------------------------------------

amd-ts - An implementation of the amd specification in typescript.

The MIT License (MIT)

Copyright (c) 2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

/// <reference path="future.ts" />
/// <reference path="http.ts" />
/// <reference path="path.ts" />
/// <reference path="definition.ts" />
/// <reference path="evaluate.ts" />

namespace amd {

  /** the search parameter */
  export interface SearchRequest {
    /** the id of the module to search. */
    id  : string
    /** the path of the module to search. */
    path: string
  }

  /** the search parameter. */
  export interface SearchResponse {
    /** true if the search discovered a bundled module. */
    module_type  : "normalized" | "bundled" | "script"
    /** the definitions found during the search */
    definitions  : Definition[]
  }
  
  /**
   * recursively searches for module definitions building up a definition accumulator.
   * @param {path} the path to search from.
   * @param {id} the id of the module.
   * @param {Definition[]} an array to build up definitions.
   * @returns {Future<{[name: string]: Definition}>} the accumulated definitions found in the search.
   */
  export const search = (parameter: SearchRequest, definitions: Definition[]) => new amd.Future<SearchResponse>((resolve, reject) => {

    // exports and require:
    //
    // when searching, we are going to hit requests
    // to search for 'require' and 'exports'. These
    // modules don't actually exist and are reserved
    // by the amd api. we simply ignore and return.
    // the handling of both are managed by the execution
    // phase.
    if (parameter.id === "exports" || parameter.id === "require") {
      resolve({module_type: "normalized", definitions: definitions})
      return
    } 

    // cyclic check:
    //
    // we only want to search a module once, here 
    // we check the definition space to see if we 
    // have already searched this module. if so, 
    // return.
    if(definitions.some(definition => definition.id === parameter.id)) {
      resolve({module_type: "normalized", definitions: definitions})
      return
    }

    // load content:
    // 
    // here we make our http request out to load the
    // module. we postfix the module id with js in
    // keeping with the AMD module spec.
    amd.http.get(parameter.path + ".js").then(content => {

      // evaluate:
      //
      // from the http content, we now evaluate the it as 
      // javascript. The evaluator will scan the script
      // for definitions, they given on the discovered
      // result.
      let discovered = amd.evaluate(parameter.id, content)

      // no definitions:
      //
      // if no definitions are found, perhaps
      // this script was not a amd module. 
      if(discovered.length == 0) {
        resolve({module_type: "script", definitions: definitions})
        return
      }

      // more than 1 definition:
      //
      // we interpret this module as being bundled.
      // in this case, we don't bother searching any
      // more and just returned whatever the evaluator
      // discovered.
      if(discovered.length > 1) {
        resolve({module_type: "bundled", definitions: discovered})
        return
      }

      // single definition:
      //
      // if the evaluator only found 1 definition,
      // there is a high likelyhook of additional
      // modules to be search. here we push the 
      // discovered definition into the accumulator
      // and build start up another search.
      definitions.push(discovered[0])
      let searches = discovered[0]
                      .dependencies
                      .map(id => search({
                        id   : id, 
                        path : amd.path.resolve(parameter.path, id)
                      }, definitions))

      // search more:
      //
      // start up the search in parallel. resolve 
      // once finished.
      amd.Future.parallel(searches)
                .then(() => resolve({module_type: "normalized", definitions: definitions}))
                .catch(reject)
                .run()

    }).catch(reject).run()
  })
}