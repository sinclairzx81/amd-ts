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

namespace amd {

  /**
   * on page load:
   * set up a window load event listener,
   * swap state to loaded on load, and 
   * dispatch any queued up ready functions.
   */
  let loaded  = false
  let queue   = []
  window.addEventListener("load", () => {
    loaded = true
    while(queue.length > 0) queue.shift()({})
  })

  /**
   * returns a promise that resolves once the window.onload event has fired.
   * @param {(d:any) => void} optional callback to be invoked once ready.
   * @returns {Promise<any>}
   */
  export function ready (callback?: (d: any) => void) : amd.Promise<any>

  /**
   * returns a promise that resolves once the window.onload event has fired.
   * @returns {Promise<any>}
   */
  export function ready () : amd.Promise<any>

  /**
   * returns a promise that resolves once the window.onload event has fired.
   * @param {any[]} arguments
   * @returns {Promise<any>}
   */
  export function ready (...args: any[]): amd.Promise<any>  {
    let param = amd.signature<{
      func  : (d:any) => void
    }> (args, [
      {  pattern: ["function"], map: (args) => ({ func: args[0]  }) },
      {  pattern: [],           map: (args) => ({ func: () => {}  }) },
    ])
    return new amd.Promise<any>((resolve, reject) => {
      if(loaded === false) {
        queue.push(param.func)
        queue.push(resolve)
      } else {
        param.func({})
        resolve({})
      }
    })
  }
}