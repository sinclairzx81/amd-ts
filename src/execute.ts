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
/// <reference path="error.ts" />

namespace amd {

  /**
   * resolves and executes the module definition to gather its exports.
   * @param {string} the id of the module to be resolved.
   * @param {Definition[]} the definition space. 
   * @param {any} a cache to store resolved modules.
   * @returns {any} the modules exports.
   */
  export const execute = (id: string, space: Definition[], cached?: any) : any => {

    // special case for exports:
    //
    // when we gather for arguments, modules will
    // attempt to gather for "exports". this happens
    // during the argument gathering step. In the
    // context of amd, the "exports" is the object
    // the module will write to. because of this,
    // we just return a new object, no caching, 
    // just this.
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
    if(definitions.length === 0) throw amd.error("execute", "unable to find module " + id, null)
    if(definitions.length >   1) throw amd.error("execute", "found multiple defintions with the same id for " + id, null)
    
    // gather arguments:
    //
    // we kick off a recursive execute to gather
    // arguments for this definition. its important
    // to note that we don't get into cyclic loops
    // due to the caching of modules.
    let args = definitions[0].dependencies.map(id => amd.execute(id, space, cached))
    
    // execute:
    //
    // here, we execute the definitions factory
    // method. its exports are going to be written
    // to during the execution. we collect them below.
    try { definitions[0].factory.apply({}, args)  }
    catch(error) { throw amd.error("execute", "unable to execute module " + id, error) }

    // cache and return:
    //
    // here, we have a slightly unusualy mechanism
    // for gathering the exports. we obtain the exports
    // by obtaining the index offset ot "exports". We
    // then cache for subsequent calls and return.
    return cached[id] = args[definitions[0].dependencies.indexOf("exports")];
  }
}