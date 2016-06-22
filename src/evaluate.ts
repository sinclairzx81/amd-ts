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
/// <reference path="definition.ts" />

namespace amd {

  /** and evaluator function */
  export interface Evaluator {
    (id: string, code: string): Definition[]
  }
  
  /**
   * evaluates the given code and returns its definitions if available.
   * @param {string} the id of the module.
   * @param {string} the code to evaluate.
   * @returns {Future<Definition[]} the definitions.
   */
  export const evaluate:Evaluator  = (id: string, code: string) : Definition[] => {

    // inspect:
    //
    // executes the given code as a AMD module. 
    // here we wrap the code in a amd api, providing
    // the code a define() function to emit definitions
    // as per the amd spec.
    const inspect:Evaluator = (id: string, code: string): Definition[] =>  {
      return eval(
        `(function(__amd_identifier) { 
            var __amd_definitions = []
            var define = function() {
                if (arguments.length === 1) __amd_definitions.push({id: __amd_identifier,  dependencies: [],           factory: arguments[0]});
                if (arguments.length === 2) __amd_definitions.push({id: __amd_identifier,  dependencies: arguments[0], factory: arguments[1]});
                if (arguments.length === 3) __amd_definitions.push({id: arguments[0],      dependencies: arguments[1], factory: arguments[2]});
            };
            define.amd = true
            ${code}\n
            return __amd_definitions
        })`)(id)
    }

    // inject:
    //
    // executes the code as a regular script element. 
    // this would go against the amd specficiation,
    // but happens to be useful enough to warrent.
    // The code is injected into the global scope.
    const inject:Evaluator = (id: string, code: string): Definition[] => {
      var head    = document.getElementsByTagName("head")[0]
      var script  = document.createElement("script")
      var source  = document.createTextNode(code)
      script.type = "text/javascript";
      script.appendChild(source)
      head.appendChild(script)
      return []
    }

    // select:
    //
    // here we pick a evaluator based on a code search
    // for define. todo: investigate searching for commented
    // out defines.
    const match   = code.match(new RegExp("define(\\s)*\\("))
    let evaluator = (match && match.length > 0) ? inspect : inject
    try {
      return evaluator(id, code)
    } catch(error) {
      throw amd.error("evaluate", "unable to evaluate module '" + id + "'. " + error, error)
    }
  }
}