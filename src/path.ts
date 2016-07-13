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

namespace amd.path {
  
  /** interface for paths. */
  export interface MappedPath {
    path  : string
    parts : string[]
  }

  /** a internally array of mapped paths. */
  const mappings: {[name: string] : MappedPath} = {}

  /**
   * maps the given name to the given path. The name given
   * will be treated as a "prefix" to any required path.
   * @param {string} the prefix to map.
   * @param {srting} the path this prefix maps to.
   * @return {void}
   */
  export function map(name: string, path: string) : void {
    mappings[name] = {path: path, parts: path.split("/").filter(part => part.length !== 0)}
  }

  /**
   * resolves the given path, factoring in any paths added
   * into the space.
   * @param {string} the path to resolve.
   * @returns {string}
   */
  export function resolve(path: string) : string {
    let split = path.split("/")
    if(split.length === 0) throw Error("amd.path: resolve: invalid path.")
    Object.keys(mappings).forEach(name => {
      if(name === split[0]) {
        split.shift()
        let rev = mappings[name].parts.map(n => n); rev.reverse()
        rev.forEach(part => split.unshift(part))
      }
    }); return split.join("/")
  }

  /**
   * returns the basename of this path (meaning the filename)
   * @param {string} the path.
   * @returns {string}
   * @example
   * amd.path.basename("./foo/bar/qux") === "qux"
   */
  export function basename(path: string) : string {
    let split = path.split('/')
    return split[split.length - 1]
  }

  /**
   * returns the directory name of the given path.
   * @param {string} the path.
   * @returns {string}
   * @example
   * amd.path.dirname("./foo/bar/qux") === "./foo/bar"
   */
  export function dirname(path: string) : string {
    let split = path.split('/')
    if(split.length > 0) split.pop()
    return split.join("/")
  }

  /**
   * returns the relative path from the "from" path to the "to" path.
   * @param {string} the from path.
   * @param {string} the to path.
   * @returns {string}
   */
  export function relative(from: string, to: string) : string {
    if(to.indexOf("http") == 0) return to;
    var stack = from.split("/");
    var parts = to.split("/");
    stack.pop();
    for (var i = 0; i < parts.length; i++) {
      if (parts[i] == ".") continue;
      if (parts[i] == "..") stack.pop();
      else stack.push(parts[i]);
    } return stack.join("/");
  }
}