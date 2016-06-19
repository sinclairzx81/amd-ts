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
