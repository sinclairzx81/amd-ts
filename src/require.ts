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
/// <reference path="execute.ts" />

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
    let param = amd.signature<{
      ids     : string[],
      factory : (...args: any[]) => void
    }> (args, [
      {  pattern: ["string", "function"], map: (args) => ({ ids : [args[0]], factory: args[1] }) },
      {  pattern: ["array",  "function"], map: (args) => ({ ids :  args[0],  factory: args[1] }) }
    ])

    // wait: 
    //
    // don't do anything until we have a 
    // signal from window.onload that the
    // document is ready.
    amd.ready(() => {

      // search:
      //
      // the caller is will be requesting
      // multiple modules. here we map each
      // into a future which we execute in
      // parallel. each search will give us
      // a definition space we use for to 
      // resolve the module.
      let searches = param.ids.map(id => search({id: amd.path.basename(id), path: id}, []))

      amd.Future.parallel(searches).then(responses => {

        // dependencies:
        //
        // the future parallel response returns an
        // array of results, in this scenario, they
        // are search results, with each result being
        // a definition space for the module being
        // requested. We use the definition space
        // to execute the module being requested,
        // these are mapped to dependecies here.
        let dependencies = responses.map((response, index) => {
          
          // require:
          //
          // before executing the module, we need create
          // a definition for require that the execute,
          // function will resolve for each. We push it
          // first and not last due to a convention on
          // bundled modules resolving from the last
          // module in the bundle.
          response.definitions.unshift({
            id           : "require", 
            dependencies : ["exports"], 
            factory      : (exports) => { exports.require = amd.require } 
          })

          switch(response.module_type) {
            // normalized:
            //
            // if not bundled, we resolve from the id given
            // by the caller. We inspect the param id and the
            // index we are using to map this dependency.
            case "normalized": {
              let id = amd.path.basename(param.ids[index])
              return amd.execute(id, response.definitions, {})
            }
            
            // bundled:
            //
            // the search is able to detect if it found
            // multiple definitions for a single module.
            // this is a indication the module it found was 
            // bundled. In typescript, the last module in 
            // the bundle is assumed to be the root id, 
            // as such, we resolve it and not the id
            // given by the caller.
            case "bundled": {
              let id = response.definitions[response.definitions.length - 1].id
              return amd.execute(id, response.definitions, {})
            }
            
            // script:
            //
            // if the caller is attempting to require
            // vanilla javascript. This script will have
            // been injected by the evaluator, need to
            // move that code here.
            case "script": {
              return null
            }
          }
        })

        // return to caller:
        param.factory.apply({}, dependencies)
        
      }).catch(error => console.log(error)).run()
    })
  }
}