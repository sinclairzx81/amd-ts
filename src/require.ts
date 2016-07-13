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
/// <reference path="./signature.ts" />
/// <reference path="./ready.ts" />
/// <reference path="./search.ts" />
/// <reference path="./resolve.ts" />

namespace amd {

  /**
   * requires a single module.
   * @param {string} the id/path of the module.
   * @returns {Promise<any[]>}
   */
  export function require (name:  string) : amd.Promise<any[]>;
  
  /**
   * requires multiple modules.
   * @param {string[]} the ids/paths of the modules.
   * @returns {Promise<any[]>}
   */
  export function require (names: string[]) : amd.Promise<any[]>

  /**
   * requires multiple modules.
   * @param {string} arguments.
   * @returns {Promise<any[]>}
   */
  export function require(...args: any[]) : amd.Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let param = amd.signature<{
        ids     : string[],
        callback: (...args: any[]) => void
      }> (args, [
        {  pattern: ["string"], map: (args) => ({ ids : [args[0]], callback: () => {} }) },
        {  pattern: ["array"],  map: (args) => ({ ids :  args[0],  callback: () => {} }) },
        {  pattern: ["string", "function"], map: (args)  => ({ ids : [args[0]],  callback: args[1] }) },
        {  pattern: ["array",  "function"],  map: (args) => ({ ids : args[0],    callback: args[1] }) },
      ])

      // wait:
      //
      // wait for the environment to be
      // ready, in the browser case, this
      // would be window.onload, in other
      // cases (such as node) this may 
      // just resolve immediate.
      amd.ready().then(() => {

        // remap paths: 
        //
        // The caller may have added custom path overrides,
        // these need to be converted into their respective
        // full paths prior to searching. so do so.
        param.ids = param.ids.map(id => amd.path.resolve(id))

        // searches: 
        //
        // construct searches from the given ids.
        // note that when searching, each id given
        // is searched in isolation, which may
        // result in the same module being loaded
        // more than once if the module is referenced
        // as a dependency between each id. The 
        // author prefers this behaviour as it
        // encourages less cross chatter between 
        // modules. It is however possible to 
        // search modules by creating a 'parent'
        // module to load everything, preventing
        // multiple loads on the same module.
        let searches = param.ids.map(id => search({
          id         : amd.path.basename(id), 
          path       : id,
          accumulator: []
        }))
        amd.Promise.all(searches).then(result => {
            
            // definition spaces:
            //
            // the result of the searches (run in parallel)
            // will be N definition spaces, one for each
            // id passed. Here we need map each space to
            // be a argument for the caller. 
            let output = result.map(definitions => {
              
              // no definitions:
              //
              // if the search didn't find any definitions,
              // there is no point continuing, return
              // undefined.
              if(definitions.length === 0) return undefined

              // inner require:
              //
              // AMD modules may require modules also,
              // and with the typescript compiler, it
              // auto adds the "require" dependency on
              // each definition. Because "require" doesn't
              // exist, we need to fake it. Here we unshift
              // the "require" module as a definition in the
              // space, it in turn calls back to this, also
              // note that we unshift and not push the 
              // definition due to the 'last module rule' 
              // below.
              definitions.unshift({
                id           : "require",
                dependencies : [], 
                factory      : () => amd.require 
              })
              
              // last module rule:
              //
              // the search function will always return the 
              // top most module as the 'last' definition
              // in a definition space. This makes selecting
              // the top most definition in the space trivial.
              let id = definitions[definitions.length - 1].id
              try { return amd.resolve(id, definitions, {}) } 
              catch(error) { reject(error) }
            })

            param.callback.apply({}, output)
            resolve(output)
        }).catch(reject)
      }).catch(reject)
    })
  }
}