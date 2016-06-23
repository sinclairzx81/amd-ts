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

/// <reference path="definition.ts" />

namespace amd {

  /**
   * returns the exports for the given module id gathering from the definition space.
   * @param {string} the id of the module to be resolved.
   * @param {Definition[]} the definition space. 
   * @param {any} a cache to store resolved modules.
   * @returns {any} the modules exports.
   */
  export const resolve = (id: string, space: Definition[], cached?: any) : any => {
    
    // special case for exports:
    //
    // TypeScript opts to write its module
    // output on this exports dependency,
    // here we give it what it wants and return
    // a empty object for it to write to, we 
    // collect it later on....
    if(id === "exports") return {}


    // caching:
    //
    // after the successful execution of a modules
    // factory, we will have obtained its exports
    // and cached them, subsequent calls to the
    // module should execute the module twice,
    // instead, we simply return the cache.
    if(cached[id] !== undefined) return cached[id]

    
    // definition space:
    //
    // the executing module has dependencies, here
    // we check the definition space for the dependecy
    // and throw if not found. Additionally, we check
    // for ambiguity and detect multiple definitions
    // in the space with the same id.
    let definitions = space.filter(definition => definition.id === id)
    if(definitions.length === 0) throw Error("resolve: unable to find module " + id)
    if(definitions.length >   1) throw Error("resolve: found multiple defintions with the same id for " + id)
    let definition = definitions[0]

    // gather arguments:
    //
    // we kick off a recursive execute to gather
    // arguments for this definition. its important
    // to note that we don't get into cyclic loops
    // due to the caching of modules.
    let args = definition.dependencies.map(id => amd.resolve(id, space, cached))
    
    // boot it:
    //
    // at this point, we have the args to pass to this
    // modules factory, do so and store output for
    // the check below.
    let output = definition.factory.apply({}, args)
    // return or exports??
    //
    // here, we run a check to see if this module took 
    // "exports" as a dependency. This would be the case
    // for typescript, but unlikely for other AMD modules.
    // If we do detect the exports dependency, we use this
    // instead of the output of the factory.
    if(definitions[0].dependencies.indexOf("exports") !== -1) 
      output = args[definitions[0].dependencies.indexOf("exports")];
    

    // cache and return:
    //
    // To prevent cyclic resolution of the same module,
    // we cache the output and return.
    return cached[id] = output;
  }
}