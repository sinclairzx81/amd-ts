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
    bundled    : boolean
    /** the definitions found during the search */
    definitions: Definition[]
  }

  /**
   * recursively searches for module definitions.
   * @param {path} the path to search from.
   * @param {id} the id of the module.
   * @param {Definition[]?} an array to build up definitions.
   * @returns {Future<{[name: string]: Definition}>} the accumulator.
   */
  export const search = (parameter: SearchRequest, definitions?: Definition[]) => new amd.Future<SearchResponse>((resolve, reject) => {

    // ensure we have a definition accumulator..
    definitions = definitions || []

    // ignore exports and require ids.
    if (parameter.id === "exports" || parameter.id === "require") {
      resolve({bundled: false, definitions: definitions})
      return
    } 

    // if we have the definition, return
    if(definitions.some(definition => definition.id === parameter.id)) {
      resolve({bundled: false, definitions: definitions})
      return
    }

    // got this far, try and load module.
    amd.http.get(parameter.path + ".js").then(content => {

      try {

        // eval the content and learn of its definitions.
        let closure     : {(define: { (...args:any[]): void }): void} = eval("(function(define) { " + content + " })")
        let accumulator : Definition[] = []
        closure((...args: any[]) => {
          if     (args.length == 1) accumulator.push({id: parameter.id, dependencies: [],      factory: args[0]})
          else if(args.length == 2) accumulator.push({id: parameter.id, dependencies: args[0], factory: args[1]})
          else if(args.length == 3) accumulator.push({id: args[0],      dependencies: args[1], factory: args[2]})
          else throw Error("amd: invalid module " + parameter.id)
        })
        
        // no definitions....resolve.
        if(accumulator.length == 0) {
          resolve({bundled: false, definitions: definitions})
          return
        }

        // more than 1 definition means a bundled module. resolve accumulator.
        if(accumulator.length > 1) {
          resolve({bundled: true, definitions: accumulator})
          return
        }

        // push this definition on the accumulator.
        definitions.push(accumulator[0])

        // map dependencies into new searches.
        let searches = accumulator[0].dependencies
                      .map(id => search({
                        id   : id, 
                        path : amd.path.resolve(parameter.path, id)
                      }, definitions))
        
        // search.
        amd.Future.series(searches)
            .then(() => resolve({bundled: false, definitions: definitions}))
            .catch(reject)
            .run()
        } catch(error) { reject(error) }
    }).catch(reject).run()
  })
}