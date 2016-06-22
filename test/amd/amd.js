var amd;
(function (amd) {
    var reflect = function (obj) {
        if (typeof obj === "function")
            return "function";
        if (typeof obj === "string")
            return "string";
        if (typeof obj === "number")
            return "number";
        if (typeof obj === "boolean")
            return "boolean";
        if (typeof obj === "object") {
            if (obj instanceof Array)
                return "array";
            if (obj instanceof Date)
                return "date";
        }
        return "object";
    };
    var match = function (args, mapping) {
        if (args.length !== mapping.pattern.length)
            return false;
        else
            return mapping.pattern.every(function (type, index) {
                return reflect(args[index]) === type;
            });
    };
    amd.signature = function (args, mappings) {
        var matches = mappings.filter(function (mapping) { return match(args, mapping); });
        if (matches.length === 1)
            return matches[0].map(args);
        else if (matches.length > 1)
            throw Error("signature: ambiguous arguments.");
        else
            throw Error("signature: no overload found for given arguments.");
    };
})(amd || (amd = {}));
var amd;
(function (amd) {
    var queue = [];
    var loaded = false;
    window.addEventListener("load", function () {
        loaded = true;
        while (queue.length > 0)
            queue.shift()();
    });
    amd.ready = function (func) {
        (loaded === false) ? queue.push(func) : func();
    };
})(amd || (amd = {}));
var amd;
(function (amd) {
    var Future = (function () {
        function Future(resolver) {
            this.resolver = resolver;
            this.value = null;
            this.error = null;
            this.state = "pending";
        }
        Future.prototype.then = function (func) {
            var _this = this;
            return new Future(function (resolve, reject) {
                _this.state = "resolving";
                _this.resolver(function (value) {
                    _this.state = "resolved";
                    _this.value = value;
                    resolve(func(_this.value));
                }, function (error) {
                    _this.state = "rejected";
                    _this.error = error;
                    reject(_this.error);
                });
            });
        };
        Future.prototype.catch = function (func) {
            var _this = this;
            return new Future(function (resolve, reject) {
                _this.state = "resolving";
                _this.resolver(function (value) {
                    _this.state = "resolved";
                    _this.value = value;
                }, function (error) {
                    _this.state = "rejected";
                    _this.error = error;
                    resolve(func(_this.error));
                });
            });
        };
        Future.prototype.run = function () {
            var _this = this;
            if (this.state == "pending") {
                this.state = "resolving";
                this.resolver(function (value) {
                    _this.value = value;
                    _this.state = "resolved";
                }, function (error) {
                    _this.error = error;
                    _this.state = "rejected";
                });
            }
            else {
                throw Error("future: run() must be called once.");
            }
        };
        Future.resolve = function (value) {
            return new Future(function (resolve, _) { return resolve(value); });
        };
        Future.reject = function (error) {
            return new Future(function (_, reject) { return reject(error); });
        };
        Future.series = function (futures) {
            return new Future(function (resolve, reject) {
                if (futures.length == 0) {
                    resolve([]);
                    return;
                }
                var results = [];
                var clone = futures.slice();
                var next = function () {
                    if (clone.length === 0) {
                        resolve(results);
                        return;
                    }
                    var future = clone.shift();
                    future.then(function (value) {
                        results.push(value);
                        next();
                    }).catch(reject)
                        .run();
                };
                next();
            });
        };
        Future.parallel = function (futures) {
            return new Future(function (resolve, reject) {
                if (futures.length == 0) {
                    resolve([]);
                    return;
                }
                var results = new Array(futures.length);
                var clone = futures.slice();
                var completed = 0;
                clone.forEach(function (future, index) {
                    future.then(function (value) {
                        completed += 1;
                        results[index] = value;
                        if (completed == futures.length)
                            resolve(results);
                    }).catch(reject)
                        .run();
                });
            });
        };
        return Future;
    }());
    amd.Future = Future;
})(amd || (amd = {}));
var amd;
(function (amd) {
    amd.error = function (phase, message, inner) {
        var error = new Error(message);
        error.phase = phase;
        error.inner = inner;
        return error;
    };
})(amd || (amd = {}));
var amd;
(function (amd) {
    var http;
    (function (http) {
        function get(url) {
            return new amd.Future(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("readystatechange", function (event) {
                    switch (xhr.readyState) {
                        case 4:
                            switch (xhr.status) {
                                case 200:
                                    resolve(xhr.responseText);
                                    break;
                                default:
                                    reject(amd.error("http", "unable to get content at " + url, null));
                                    break;
                            }
                            break;
                    }
                });
                xhr.open("GET", url, true);
                xhr.send();
            });
        }
        http.get = get;
    })(http = amd.http || (amd.http = {}));
})(amd || (amd = {}));
var amd;
(function (amd) {
    var path;
    (function (path_1) {
        function basename(path) {
            var split = path.split('/');
            return split[split.length - 1];
        }
        path_1.basename = basename;
        function resolve(from, to) {
            if (to.indexOf("http") == 0)
                return to;
            var stack = from.split("/");
            var parts = to.split("/");
            stack.pop();
            for (var i = 0; i < parts.length; i++) {
                if (parts[i] == ".")
                    continue;
                if (parts[i] == "..")
                    stack.pop();
                else
                    stack.push(parts[i]);
            }
            return stack.join("/");
        }
        path_1.resolve = resolve;
    })(path = amd.path || (amd.path = {}));
})(amd || (amd = {}));
var amd;
(function (amd) {
    amd.evaluate = function (id, code) {
        var inspect = function (id, code) {
            return eval("(function(__amd_identifier) { \n            var __amd_definitions = []\n            var define = function() {\n                if (arguments.length === 1) __amd_definitions.push({id: __amd_identifier,  dependencies: [],           factory: arguments[0]});\n                if (arguments.length === 2) __amd_definitions.push({id: __amd_identifier,  dependencies: arguments[0], factory: arguments[1]});\n                if (arguments.length === 3) __amd_definitions.push({id: arguments[0],      dependencies: arguments[1], factory: arguments[2]});\n            };\n            define.amd = true\n            " + code + "\n\n            return __amd_definitions\n        })")(id);
        };
        var inject = function (id, code) {
            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            var source = document.createTextNode(code);
            script.type = "text/javascript";
            script.appendChild(source);
            head.appendChild(script);
            return [];
        };
        var match = code.match(new RegExp("define(\\s)*\\("));
        var evaluator = (match && match.length > 0) ? inspect : inject;
        try {
            return evaluator(id, code);
        }
        catch (error) {
            throw amd.error("evaluate", "unable to evaluate module '" + id + "'. " + error, error);
        }
    };
})(amd || (amd = {}));
var amd;
(function (amd) {
    amd.search = function (parameter, definitions) { return new amd.Future(function (resolve, reject) {
        if (parameter.id === "exports" || parameter.id === "require") {
            resolve({ module_type: "normalized", definitions: definitions });
            return;
        }
        if (definitions.some(function (definition) { return definition.id === parameter.id; })) {
            resolve({ module_type: "normalized", definitions: definitions });
            return;
        }
        amd.http.get(parameter.path + ".js").then(function (content) {
            var discovered = amd.evaluate(parameter.id, content);
            if (discovered.length == 0) {
                resolve({ module_type: "script", definitions: definitions });
                return;
            }
            if (discovered.length > 1) {
                resolve({ module_type: "bundled", definitions: discovered });
                return;
            }
            definitions.push(discovered[0]);
            var searches = discovered[0]
                .dependencies
                .map(function (id) { return amd.search({
                id: id,
                path: amd.path.resolve(parameter.path, id)
            }, definitions); });
            amd.Future.parallel(searches)
                .then(function () { return resolve({ module_type: "normalized", definitions: definitions }); })
                .catch(reject)
                .run();
        }).catch(reject).run();
    }); };
})(amd || (amd = {}));
var amd;
(function (amd) {
    amd.execute = function (id, space, cached) {
        if (id === "exports")
            return {};
        if (cached[id] !== undefined)
            return cached[id];
        var definitions = space.filter(function (definition) { return definition.id === id; });
        if (definitions.length === 0)
            throw amd.error("execute", "unable to find module " + id, null);
        if (definitions.length > 1)
            throw amd.error("execute", "found multiple defintions with the same id for " + id, null);
        var args = definitions[0].dependencies.map(function (id) { return amd.execute(id, space, cached); });
        try {
            definitions[0].factory.apply({}, args);
        }
        catch (error) {
            throw amd.error("execute", "unable to execute module " + id, error);
        }
        return cached[id] = args[definitions[0].dependencies.indexOf("exports")];
    };
})(amd || (amd = {}));
var amd;
(function (amd) {
    function require() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = amd.signature(args, [
            { pattern: ["string", "function"], map: function (args) { return ({ ids: [args[0]], factory: args[1] }); } },
            { pattern: ["array", "function"], map: function (args) { return ({ ids: args[0], factory: args[1] }); } }
        ]);
        amd.ready(function () {
            var searches = param.ids.map(function (id) { return amd.search({ id: amd.path.basename(id), path: id }, []); });
            amd.Future.parallel(searches).then(function (responses) {
                var dependencies = responses.map(function (response, index) {
                    response.definitions.unshift({
                        id: "require",
                        dependencies: ["exports"],
                        factory: function (exports) { exports.require = amd.require; }
                    });
                    switch (response.module_type) {
                        case "normalized": {
                            var id = amd.path.basename(param.ids[index]);
                            return amd.execute(id, response.definitions, {});
                        }
                        case "bundled": {
                            var id = response.definitions[response.definitions.length - 1].id;
                            return amd.execute(id, response.definitions, {});
                        }
                        case "script": {
                            return null;
                        }
                    }
                });
                param.factory.apply({}, dependencies);
            }).catch(function (error) { return console.log(error); }).run();
        });
    }
    amd.require = require;
})(amd || (amd = {}));
