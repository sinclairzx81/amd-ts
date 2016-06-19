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

/// <reference path="signature.ts" />
/// <reference path="ready.ts" />
/// <reference path="search.ts" />
/// <reference path="resolve.ts" />

namespace amd {

  /**
   * imports a single module.
   * @param {string} the name of the module.
   * @param {(arg : any) => void} callback to receive the module.
   * @returns {void}
   */
  export function require (name:  string, func: (arg: any)   => void) : void;
  
  /**
   * imports multiple modules.
   * @param {string} the names of the modules.
   * @param {(...arg : any[]) => void} callback to receive the modules.
   * @returns {void}
   */
  export function require (names: string[], func: (...args: any[]) => void) : void;

  /**
   * requires a module.
   * @param {...args:any[]} arguments.
   * @returns {void}
   */
  export function require(...args: any[]) : void {
    // format arguments.
    let param = amd.signature<{
      ids     : string[],
      factory : (...args: any[]) => void
    }> (args, [
      {  pattern: ["string", "function"], map: (args) => ({ ids : [args[0]], factory: args[1] }) },
      {  pattern: ["array",  "function"], map: (args) => ({ ids :  args[0],  factory: args[1] }) }
    ])

    // wait for window
    amd.ready(() => {

      // construct module searches from param.ids...
      let searches = param.ids.map(id => search({id: amd.path.basename(id), path: id}))

      // execute searches in parallel...
      amd.Future.parallel(searches).then(responses => {

        // map the response definitions to caller arguments.
        let args = responses.map((response, index) => {
          
          // unshift require into the definition space.
          response.definitions.unshift({
            id           : "require", 
            dependencies : ["exports"], 
            factory      : (exports) => { exports.require = amd.require } 
          })

          // if bundled, the 'last' definition id is the rootid.
          if(response.bundled) {
            let id = response.definitions[response.definitions.length - 1].id
            return amd.resolve(id, response.definitions, {})
          }
          // otherwise, the root is the id given by the caller.
          else {
            let id = amd.path.basename(param.ids[index])
            return amd.resolve(id, response.definitions, {})
          }
        })

        // return to caller with the mapped arguments.
        param.factory.apply({}, args)

      }).catch(error => console.log(error)).run()
    })
  }
}