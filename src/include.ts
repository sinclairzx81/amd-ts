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

/// <reference path="./signature.ts" />
/// <reference path="./promise.ts" />
/// <reference path="./http.ts" />

namespace amd {

  /**
   * includes this script. same as using a script tag on the page.
   * @param {string} the id/path of the script.
   * @param {(d:any) => void} optional callback invoked once script is included.
   * @returns {Promise<any>}
   */
  export function include(id: string, func: () => void) : amd.Promise<any>
  
  /**
   * includes these scripts. same as adding script tags to a page.
   * @param {string[]} the ids/paths of the modules.
   * @param {(d:any) => void} optional callback invoked once script is included.
   * @returns {Promise<any>}
   */
  export function include(ids: string[], func: () => void) :  amd.Promise<any>

  /**
   * includes this script. same as using a script tag on the page.
   * @param {string} the id/path of the script.
   * @returns {Promise<any>}
   */
  export function include(id: string) : amd.Promise<any>
  
  /**
   * includes these scripts. same as adding script tags to a page.
   * @param {string[]} the ids/paths of the modules.
   * @returns {Promise<any>}
   */
  export function include(ids: string[]) :  amd.Promise<any>

  /**
   * rincludes these scripts. same as adding script tags to a page.
   * @param {any[]} arguments.
   * @returns {Promise<any>}
   */
  export function include(...args: any[]): amd.Promise<any> {
    return new amd.Promise<any>((resolve, reject) => {
      let param = amd.signature<{
        ids   : string[]
        func  : (d:any) => void
      }> (args, [
        {  pattern: ["string", "function"], map: (args) => ({ ids : [args[0]], func: args[1]  }) },
        {  pattern: ["array",  "function"], map: (args) => ({ ids :  args[0] , func: args[1]  }) },
        {  pattern: ["string"],             map: (args) => ({ ids : [args[0]], func: () => {} }) },
        {  pattern: ["array"],              map: (args) => ({ ids :  args[0] , func: () => {} }) }
      ])

      // remap and normalize paths.
      //
      // The caller may have added custom path overrides,
      // these need to be converted into their respective
      // full paths prior to searching. 
      //
      // in addition, we check that the paths given by the 
      // caller contain .js, if not, postfix the path with 
      // js. From the callers point of view, passing or not
      // passing the extention with including script is
      // optional.
      let paths = param.ids.map(id => amd.path.resolve(id))
                           .map(id => (id.indexOf(".js") === -1) ? id + ".js" : id)

      /** 
       * map to http requests:
       * 
       * for each path, convert it to a http request.
       */
      let requests = paths.map(path => amd.http.get(path))
      
      /**
       * gather:
       * 
       * next, we load each request in parallel. The 
       * results of each request will be mapped into
       * dom elements.
       */
      Promise.all(requests).then(responses => {
        /**
         * inject:
         * 
         * here, we enumerate http responses, injecting
         * the content/script into the HTML DOM like we 
         * would do with a script tag.
         */
        responses.forEach((source, index) => {
            try {
              var head    = document.getElementsByTagName("head")[0]
              var script  = document.createElement("script")
              var code    = document.createTextNode(source)
              script.type = "text/javascript";
              script.appendChild(code)
              head.appendChild(script)
            } catch(error) {
              reject(error)
            }
            param.func({})
            resolve({})
        })
      }).catch(reject)
    })
  }
}