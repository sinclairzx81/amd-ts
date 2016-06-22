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
        (error: any): void;
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
        public: any;
        catch<U>(func: (error: any) => U): Future<U>;
        run(): void;
        static resolve<T>(value: T): Future<T>;
        static reject<T>(error: any): Future<T>;
        static series<T>(futures: Future<T>[]): Future<T[]>;
        static parallel<T>(futures: Future<T>[]): Future<T[]>;
    }
}
declare namespace amd {
    type Phase = "require" | "search" | "http" | "evaluate" | "execute" | "script" | "unknown";
}
declare namespace amd {
    interface IError {
        phase: amd.Phase;
        message: string;
        inner: Error;
    }
    const error: (phase: "require" | "search" | "http" | "evaluate" | "execute" | "script" | "unknown", message: string, inner: Error) => IError;
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
    interface Evaluator {
        (id: string, code: string): Definition[];
    }
    const evaluate: Evaluator;
}
declare namespace amd {
    interface SearchRequest {
        id: string;
        path: string;
    }
    interface SearchResponse {
        module_type: "normalized" | "bundled" | "script";
        definitions: Definition[];
    }
    const search: (parameter: SearchRequest, definitions: Definition[]) => Future<SearchResponse>;
}
declare namespace amd {
    const execute: (id: string, space: Definition[], cached?: any) => any;
}
declare namespace amd {
    function require(name: string, func: (arg: any) => void): void;
    function require(names: string[], func: (...args: any[]) => void): void;
}
