declare namespace amd {
    const spread: (arr: any[], func: (...args: any[]) => void) => void;
}
declare namespace amd {
    type SignatureTypeName = "function" | "string" | "number" | "array" | "object" | "date" | "boolean";
    interface SignatureMapping<T> {
        pattern: SignatureTypeName[];
        map: (args: any[]) => T;
    }
    const signature: <T>(args: any[], mappings: SignatureMapping<T>[]) => T;
}
declare namespace amd {
    interface Reject {
        (reason: string | Error): void;
    }
    interface Resolve<T> {
        (value: T): void;
    }
    interface Executor<T> {
        (resolve: Resolve<T>, reject: Reject): void;
    }
    class Promise<T> {
        private executor;
        private value_callbacks;
        private error_callbacks;
        state: "pending" | "fulfilled" | "rejected";
        value: T;
        error: string | Error;
        constructor(executor: Executor<T>);
        then<U>(onfulfilled: (value: T) => U | Promise<U>, onrejected?: (reason: string | Error) => void): Promise<U>;
        catch<U>(onrejected: (reason: string | Error) => U | Promise<U>): Promise<U>;
        static all<T>(promises: Promise<T>[]): Promise<T[]>;
        static race<T>(promises: Promise<T>[]): Promise<T>;
        static resolve<T>(value: T | Promise<T>): Promise<T>;
        static reject<T>(reason: string | Error): Promise<T>;
        private _resolve(value);
        private _reject(reason);
    }
}
declare namespace amd.http {
    const get: (url: string) => Promise<string>;
}
declare namespace amd {
    function include(id: string, func: () => void): amd.Promise<any>;
    function include(ids: string[], func: () => void): amd.Promise<any>;
}
declare namespace amd {
    const ready: () => Promise<any>;
}
declare namespace amd.path {
    function basename(path: string): string;
    function resolve(from: string, to: string): string;
}
declare namespace amd {
    interface Definition {
        id: string;
        dependencies: string[];
        factory: (...args: any[]) => any;
    }
}
declare namespace amd {
    interface SearchParameter {
        id: string;
        path: string;
        accumulator: Definition[];
    }
    const search: (parameter: SearchParameter) => Promise<Definition[]>;
}
declare namespace amd {
    const resolve: (id: string, space: Definition[], cached?: any) => any;
}
declare namespace amd {
    function require(name: string): amd.Promise<any[]>;
    function require(names: string[]): amd.Promise<any[]>;
}
