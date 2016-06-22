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

module amd {

  /**
   * interface for the resolve function.
   */
  export interface FutureResolveFunc <T> {
      (value: T): void
    }
    /**
     * interface for the reject function.
     */
  export interface FutureRejectFunc {
    (error: any): void
  }

  /**
   * interface for the resolver function.
   */
  export interface FutureResolverFunc <T> {
    (resolve: FutureResolveFunc <T> , reject: FutureRejectFunc): void
  }

  /**
   * Future:
   * Asynchronous primitive to resolve operations into
   * the future. Similiar to a promise except the caller
   * needs to call .run() to begin resolving.
   */
  export class Future < T extends any > {
    public state: "pending" | "resolving" | "resolved" | "rejected";
    public value: T = null;
    public error: any = null;

    /**
     * creates a new future.
     * @param {FutureResolverFunc<T>} the resolver function.
     * @returns {Future<T>}
     */
    constructor(private resolver: FutureResolverFunc <T> ) {
      this.state = "pending"
    }

    /**
     * A success continutation.
     * @param {Function} callback triggered on success.
     * @returns {Future<T>}
     */
    public then < U > (func: (value: T) => U): Future < U > {
      return new Future < U > ((resolve, reject) => {
        this.state = "resolving"
        this.resolver(value => {
          this.state = "resolved"
          this.value = value
          resolve(func(this.value))
        }, error => {
          this.state = "rejected"
          this.error = error
          reject(this.error)
        })
      })
    }

    /**
     * A error continutation.
     * @param {Function} callback triggered on fail.
     * @returns {Future<T>}
     */
    public
    catch < U > (func: (error: any) => U): Future < U > {
      return new Future < U > ((resolve, reject) => {
        this.state = "resolving"
        this.resolver(value => {
          this.state = "resolved"
          this.value = value
        }, error => {
          this.state = "rejected"
          this.error = error
          resolve(func(this.error))
        })
      })
    }

    /**
     * starts resolving this future.
     * @returns {void}
     */
    public run(): void {
      if (this.state == "pending") {
        this.state = "resolving";
        this.resolver(value => {
          this.value = value
          this.state = "resolved"
        }, error => {
          this.error = error
          this.state = "rejected"
        })
      } else {
        throw Error("future: run() must be called once.")
      }
    }

    /**
     * creates a future that will resolve to the given value.
     * @param {T} the value to resolve.
     * @returns{Future<T>}
     */
    public static resolve <T> (value: T): Future <T> {
      return new Future <T> ((resolve, _) => resolve(value))
    }

    /**
     * creates a future that will reject with the given error.
     * @param {Error} the error to reject with.
     * @returns{Future<T>}
     */
    public static reject <T> (error: any): Future <T> {
      return new Future <T> ((_, reject) => reject(error))
    }

    /**
     * returns a future which runs its inner futures in series.
     * @param {Future<T>[]} an array of futures.
     * @returns {Future<T[]>}
     */
    public static series <T> (futures: Future <T> []): Future < T[] > {
      return new Future < T[] > ((resolve, reject) => {
        if (futures.length == 0) {
          resolve([]);
          return;
        }
        var results = []
        let clone = futures.slice()
        let next = () => {
          if (clone.length === 0) {
            resolve(results);
            return;
          }
          let future = clone.shift()
          future.then(value => {
              results.push(value)
              next()
            }).catch(reject)
            .run()
        };
        next()
      })
    }

    /**
     * returns a future which runs its inner futures in parallel.
     * @param {Future<T>[]} an array of futures.
     * @returns {Future<T[]>}
     */
    public static parallel <T> (futures: Future <T> []): Future < T[] > {
      return new Future < T[] > ((resolve, reject) => {
        if (futures.length == 0) {
          resolve([]);
          return;
        }
        var results = new Array(futures.length)
        let clone = futures.slice()
        var completed = 0;
        clone.forEach((future, index) => {
          future.then(value => {
              completed += 1;
              results[index] = value;
              if (completed == futures.length)
                resolve(results)
            }).catch(reject)
            .run()
        })
      })
    }
  }
}