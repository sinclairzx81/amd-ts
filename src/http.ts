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
/// <reference path="error.ts" />

namespace amd.http {

  /**
   * http gets the content at the given url.
   * @param {string} the url endpoint.
   * @returns {Future<string>}
   */
  export function get(url: string) : amd.Future<string> {
    return new amd.Future<string>((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.addEventListener("readystatechange", event => {
        switch(xhr.readyState) {
          case 4:
            switch(xhr.status) {
              case 200: resolve (xhr.responseText); break;
              default:  reject  (amd.error("http", "unable to get content at " + url, null)); break;
            } break;
        }
      })
      xhr.open("GET", url, true)
      xhr.send()
    })
  }
}