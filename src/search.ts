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

/// <reference path="./promise.ts" />
/// <reference path="./http.ts" />
/// <reference path="./path.ts" />
/// <reference path="./signature.ts" />
/// <reference path="./definition.ts" />

namespace amd {

  /** 
   * SearchParameter:
   * 
   * Parameter given to the search function. callers
   * are to pass the id/path of the module. The
   * path (which may be relative) and a accumulator
   * in which to gather definitions found during the
   * search.
   */
  export interface SearchParameter {
    id         : string
    path       : string
    accumulator: Definition[]
  }

  /**
   * extracts definitions from the given module code.
   * @param {string} the id of the module.
   * @param {string} the code to evaluate.
   * @returns {Definition[]} the definitions.
   */
  const extract = (id: string, code: string) : Definition[] => {
    let definitions = []
    let define:any  = (...args: any[]) => {
      definitions.push(amd.signature<Definition>(args, [
        { pattern: ["function"],                    map: args => ({ id: id,      dependencies: [],      factory: args[0] })},
        { pattern: ["string", "function"],          map: args => ({ id: args[0], dependencies: [],      factory: args[1] })},
        { pattern: ["string", "array", "function"], map: args => ({ id: args[0], dependencies: args[1], factory: args[2] })},
        { pattern: ["array", "function"],           map: args => ({ id: id,      dependencies: args[0], factory: args[1] })},
        { pattern: ["object"],                      map: args => ({ id: id,      dependencies: [],      factory: () => args[0] })},
        { pattern: ["string", "object"],            map: args => ({ id: args[0], dependencies: [],      factory: () => args[1] })},
        { pattern: ["string", "array", "object"],   map: args => ({ id: args[0], dependencies: args[1], factory: () => args[2] })}
      ]))
    }
    define.amd = true
    eval(`(function(define) { ${code}\n })`)(define)
    return definitions
  }

  /**
   * recursively searches for module definitions building up a definition accumulator along the way.
   * @param {SearchParameter} the search parameter.
   * @returns {Definition[]} definitions found during the search.
   */
  export const search = (parameter: SearchParameter) => new amd.Promise<Definition[]>((resolve, reject) => {

    // exports and require:
    //
    // when searching, we are going to hit requests
    // to come across instances where a module expects
    // a dependency on exports or require. In this 
    // scenario, we just return, and pick up the tab
    // during the resolve phase.
    if (parameter.id === "exports" || parameter.id === "require") {
      resolve(parameter.accumulator); return
    }

    // (bug) cyclic check:
    //
    // we only want to search a module once, here 
    // we check the definition space to see if we 
    // have already searched this module. if so, 
    // just resolve and return.
    if(parameter.accumulator.some(definition => definition.id === parameter.id)) {
      resolve(parameter.accumulator); return
    }

    // http:
    // 
    // here we make our http request out to load the
    // module. postfix the path with .js and go.
    amd.http.get(parameter.path + ".js").then(content => {

      // discover:
      //
      // from the http response, we need to read out any
      // definitions. we do this by passing it over to
      // the discover function, it returns definitions.
      let extracted: Definition[] = null
      try  { extracted = extract(parameter.id, content) }
      catch(error) { reject(error); return }
      
      // nothing:
      //
      // its possible to require a module with 0
      // definitions (i.e the module didn't define()
      // anything). In this scenario, just resolve 
      // and return.
      if(extracted.length === 0) {
        resolve(parameter.accumulator)
        return
      }

      // bundled:
      //
      // there is no specification i could find for 
      // bundled AMD modules, this library makes
      // the assumption that one definition per file
      // is the norm, and multiple definitions are
      // considered bundles. in this case, we just
      // return the extracted definitions and return.
      if(extracted.length > 1) {
        resolve(extracted)
        return
      }

      // single definition:
      //
      // at this point, we know we have just loaded
      // a module with only 1 definition inside. this
      // is typical behavior. store it.
      let definition = extracted[0]

      // (bug) prevent duplicates.
      //
      // because we may arrive at a module from varying
      // locations, the path/id be varying even for the 
      // same module. A better pathing mechansism is 
      // required to prevent this, however, by checking
      // that we don't already have the definition is
      // a quick fix to prevent any duplicates.
      if(parameter.accumulator.some(n => n.id === definition.id)) {
        resolve(parameter.accumulator); return
      } parameter.accumulator.unshift(definition)

      // search more:
      //
      // the definition will likely have dependencies 
      // which need to be searched before we can resolve
      // this definition. we build up a new search for
      // each dependency found, noting that the path
      // to the dependency is relative to the current
      // definition (from the modules perspective).
      // also note, that we want to filter out 
      // any ids we already have..check the accumulator.
      let searches = definition.dependencies
                               // (bug) : still causing multiple searches on the same module.
                               //         need to look at potentially passing a global root
                               //         and pathing relative to that.
                               .filter(id => !(parameter.accumulator.some(def => def.id === id))) 
                               .map   (id => search({
                                  id          : id, 
                                  path        : amd.path.resolve(parameter.path, id),
                                  accumulator : parameter.accumulator
                               }))
      
      // search, then resolve.   
      amd.Promise
         .all   (searches)
         .then  (()    => resolve(parameter.accumulator))
         .catch (error => reject(error))
    }).catch(reject)
  })
}