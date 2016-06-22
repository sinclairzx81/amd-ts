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
declare namespace amd {
    type SignatureTypeName = "function" | "string" | "number" | "array" | "object" | "date" | "boolean";
    interface SignatureMapping<T> {
        pattern: SignatureTypeName[];
        map: (args: any[]) => T;
    }
    const signature: <T>(args: any[], mappings: SignatureMapping<T>[]) => T;
}
declare namespace amd {
    const ready: (func: () => void) => void;
}
declare module amd {
    interface FutureResolveFunc<T> {
        (value: T): void;
    }
    interface FutureRejectFunc {
        (error: Error): void;
    }
    interface FutureResolverFunc<T> {
        (resolve: FutureResolveFunc<T>, reject: FutureRejectFunc): void;
    }
    class Future<T extends any> {
        private resolver;
        state: "pending" | "resolving" | "resolved" | "rejected";
        value: T;
        error: any;
        constructor(resolver: FutureResolverFunc<T>);
        then<U>(func: (value: T) => U): Future<U>;
        catch<U>(func: (error: Error) => U): Future<U>;
        run(): void;
        static resolve<T>(value: T): Future<T>;
        static reject<T>(error: Error): Future<T>;
        static series<T>(futures: Future<T>[]): Future<T[]>;
        static parallel<T>(futures: Future<T>[]): Future<T[]>;
    }
}
declare namespace amd.http {
    function get(url: string): amd.Future<string>;
}
declare namespace amd.path {
    function basename(path: string): string;
    function resolve(from: string, to: string): string;
}
declare namespace amd {
    interface Definition {
        id: string;
        dependencies: string[];
        factory: (...args: any[]) => void;
    }
}
declare namespace amd {
    const evaluate: (id: string, code: string) => Future<Definition[]>;
}
declare namespace amd {
    interface SearchRequest {
        id: string;
        path: string;
    }
    interface SearchResponse {
        bundled: boolean;
        definitions: Definition[];
    }
    const search: (parameter: SearchRequest, definitions?: Definition[]) => Future<SearchResponse>;
}
declare namespace amd {
    const resolve: (id: string, space: Definition[], cached?: any) => any;
}
declare namespace amd {
    function require(name: string, func: (arg: any) => void): void;
    function require(names: string[], func: (...args: any[]) => void): void;
}
