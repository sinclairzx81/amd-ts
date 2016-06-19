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
   * resolves a a module from the given definitions.
   * @param {string} the id of the module to be resolved.
   * @param {Definition[]} the definition space. 
   * @param {any} a cache to store resolved modules.
   * @returns {any} the modules exports.
   */
  export const resolve = (id: string, space: Definition[], cached?: any) : any => {
    
    // initialize cache if not set.
    cached = cached || {}

    // return new object on exports.
    if(id === "exports") return {}

    // if the module has already been cached,
    // return it immediately to prevent cyclic
    // resolution.
    if(cached[id] !== undefined) return cached[id]

    // locate the definition within the definition space.
    let definitions = space.filter(definition => definition.id === id)
    if(definitions.length === 0) throw Error("amd: unable to find module " + id)
    if(definitions.length >   1) throw Error("amd: found multiple defintions with the same id for " + id)
    
    // recursively resolve the the dependencies and inject.
    let args = definitions[0].dependencies.map(id => amd.resolve(id, space, cached))
    definitions[0].factory.apply({}, args)

    // cache it and return.
    return cached[id] = args[definitions[0].dependencies.indexOf("exports")];
  }
}