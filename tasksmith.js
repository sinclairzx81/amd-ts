/*--------------------------------------------------------------------------

tasksmith - task automation library for node.

The MIT License (MIT)

Copyright (c) 2015-2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

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
var definitions = {};
var cached = {
    "require": function (arg, callback) { return callback(require(arg)); },
    "exports": {}
};
var define = function (name, deps, fn) {
    definitions[name] = { deps: deps, fn: fn };
};
var __resolve = function (name) {
    if (name === "exports")
        return {};
    if (cached[name] !== undefined) {
        return cached[name];
    }
    else if (definitions[name] !== undefined) {
        var args = definitions[name].deps.map(function (name) { return __resolve(name); });
        definitions[name].fn.apply({}, args);
        return cached[name] = args[definitions[name].deps.indexOf("exports")];
    }
    else {
        return require(name);
    }
};
var __collect = function () {
    var ids = Object.keys(definitions);
    return __resolve(ids[ids.length - 1]);
};

define("common/signature", ["require", "exports"], function (require, exports) {
    "use strict";
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
    exports.signature = function (args, mappings) {
        var matches = mappings.filter(function (mapping) { return match(args, mapping); });
        if (matches.length === 1)
            return matches[0].map(args);
        else if (matches.length > 1)
            throw Error("signature: ambiguous arguments.");
        else
            throw Error("signature: no overload found for given arguments.");
    };
});
define("common/tabulate", ["require", "exports"], function (require, exports) {
    "use strict";
    var pad = function (length) {
        var buf = "";
        for (var i = 0; i < length; i++)
            buf = buf.concat(" ");
        return buf;
    };
    var defaults = function (mapping) { return ({
        key: (mapping.key !== undefined) ? mapping.key : "",
        width: (mapping.width !== undefined) ? mapping.width : 8,
        pad: (mapping.pad !== undefined) ? mapping.pad : 0,
        wrap: (mapping.wrap !== undefined) ? mapping.wrap : false,
        map: (mapping.map !== undefined) ? mapping.map : function (value) {
            if (value === undefined)
                return "undefined";
            if (value === null)
                return "null";
            return value.toString();
        }
    }); };
    var map = function (obj, mapping) { return ({
        width: mapping.width,
        pad: mapping.pad,
        wrap: mapping.wrap,
        lines: (obj[mapping.key] === undefined && obj[mapping.key] === null)
            ? [""]
            : mapping.map(obj[mapping.key])
                .replace("\r", "")
                .replace("\t", "  ")
                .split("\n")
    }); };
    var truncate = function (cell) { return ({
        wrap: cell.wrap,
        width: cell.width,
        pad: cell.pad,
        lines: cell.lines.reduce(function (buf, line, index) {
            var copy = line.slice(0);
            var width = cell.width - cell.pad;
            copy = (copy.length >= width)
                ? copy.substring(0, width)
                : copy;
            var feed = "".concat(copy, pad(cell.width - copy.length));
            buf.push(feed);
            return buf;
        }, [])
    }); };
    var wrap = function (cell) { return ({
        wrap: cell.wrap,
        width: cell.width,
        pad: cell.pad,
        lines: cell.lines.reduce(function (buf, line) {
            var copy = line.slice(0);
            var padding = pad(cell.pad);
            var inner = cell.width - cell.pad;
            while (copy.length > inner) {
                var feed_1 = "".concat(copy.substring(0, inner), padding);
                copy = copy.substring(inner);
                buf.push(feed_1);
            }
            var feed = "".concat(copy, pad(cell.width - copy.length));
            buf.push(feed);
            return buf;
        }, [])
    }); };
    var project = function (cells) {
        var result = [];
        var empty = cells.map(function (cell) { return pad(cell.width); });
        var linecount = cells.reduce(function (acc, cell) { return (cell.lines.length > acc)
            ? cell.lines.length
            : acc; }, 0);
        for (var li = 0; li < linecount; li++) {
            for (var ci = 0; ci < cells.length; ci++) {
                (li < cells[ci].lines.length)
                    ? result.push(cells[ci].lines[li])
                    : result.push(empty[ci]);
            }
            if (li < linecount - 1)
                result.push("\n");
        }
        return result.join("");
    };
    exports.tabulate = function (mappings) {
        return function (obj) {
            return project(mappings.map(function (mapping) { return defaults(mapping); })
                .map(function (mapping) { return map(obj, mapping); })
                .map(function (cell) { return cell.wrap ? wrap(cell)
                : truncate(cell); }));
        };
    };
});
define("core/task", ["require", "exports"], function (require, exports) {
    "use strict";
    var Task = (function () {
        function Task(name, func) {
            this.name = name;
            this.func = func;
            this.subscribers = new Array();
            this.state = "pending";
            this.id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        Task.prototype.subscribe = function (subscriber) {
            this.subscribers.push(subscriber);
            return this;
        };
        Task.prototype.run = function () {
            var _this = this;
            if (this.state !== "pending") {
                return new Promise(function (_, reject) { return reject(Error("this task has already started.")); });
            }
            else {
                return new Promise(function (resolve, reject) {
                    try {
                        _this.state = "running";
                        _this.subscribers.forEach(function (subscriber) { return subscriber({
                            id: _this.id,
                            task: _this.name,
                            time: new Date(),
                            type: "start",
                            data: ""
                        }); });
                        _this.func(_this.id, function (event) {
                            switch (event.type) {
                                case "start":
                                    if (_this.state === "running") {
                                        _this.subscribers.forEach(function (subscriber) { return subscriber(event); });
                                    }
                                    break;
                                case "log":
                                    if (_this.state === "running") {
                                        _this.subscribers.forEach(function (subscriber) { return subscriber(event); });
                                    }
                                    break;
                                case "ok":
                                    if (_this.state === "running") {
                                        _this.subscribers.forEach(function (subscriber) { return subscriber(event); });
                                        if (event.id === _this.id) {
                                            _this.state = "completed";
                                            resolve(event.data);
                                        }
                                    }
                                    break;
                                case "fail":
                                    if (_this.state === "running") {
                                        _this.subscribers.forEach(function (subscriber) { return subscriber(event); });
                                        if (event.id === _this.id) {
                                            _this.state = "failed";
                                            reject(new Error(event.data));
                                        }
                                    }
                                    break;
                            }
                        });
                    }
                    catch (error) {
                        if (_this.state === "running") {
                            _this.state = "failed";
                            _this.subscribers.forEach(function (subscriber) { return subscriber({
                                id: _this.id,
                                task: _this.name,
                                time: new Date(),
                                type: "fail",
                                data: error.message
                            }); });
                            reject(error);
                        }
                    }
                });
            }
        };
        return Task;
    }());
    exports.Task = Task;
});
define("core/script", ["require", "exports", "common/signature", "core/task"], function (require, exports, signature_1, task_1) {
    "use strict";
    function format(args) {
        if (args === null || args === undefined)
            return "";
        if (Array.isArray(args) === false)
            return "";
        var buffer = [];
        for (var i = 0; i < args.length; i++) {
            if (args[i] === null || args[i] === undefined)
                continue;
            var str = args[i].toString();
            if (str.length === 0)
                continue;
            buffer.push(str);
        }
        return (buffer.length === 1)
            ? buffer[0]
            : buffer.join(' ');
    }
    function script() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_1.signature(args, [
            { pattern: ["string", "function"], map: function (args) { return ({ task: args[0], func: args[1] }); } },
            { pattern: ["function"], map: function (args) { return ({ task: "core/script", func: args[0] }); } },
        ]);
        return new task_1.Task(param.task, function (id, emitter) {
            param.func({
                log: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    return emitter({ id: id, task: param.task, time: new Date(), type: "log", data: format(args) });
                },
                ok: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    return emitter({ id: id, task: param.task, time: new Date(), type: "ok", data: format(args) });
                },
                fail: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    return emitter({ id: id, task: param.task, time: new Date(), type: "fail", data: format(args) });
                },
                run: function (task) { return task.subscribe(function (event) { return emitter(event); }).run(); }
            });
        });
    }
    exports.script = script;
});
define("core/delay", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_2, script_1) {
    "use strict";
    function delay() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_2.signature(args, [
            { pattern: ["string", "number"], map: function (args) { return ({ message: args[0], ms: args[1] }); } },
            { pattern: ["number"], map: function (args) { return ({ message: null, ms: args[0] }); } },
        ]);
        return script_1.script("core/delay", function (context) {
            if (param.message !== null)
                context.log(param.message);
            setTimeout(function () { return context.ok(); }, param.ms);
        });
    }
    exports.delay = delay;
});
define("core/dowhile", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_3, script_2) {
    "use strict";
    function dowhile() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_3.signature(args, [
            { pattern: ["string", "function", "function"], map: function (args) { return ({ message: args[0], condition: args[1], taskfunc: args[2] }); } },
            { pattern: ["function", "function"], map: function (args) { return ({ message: null, condition: args[0], taskfunc: args[1] }); } },
        ]);
        return script_2.script("core/dowhile", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var next = function () {
                context.run(param.taskfunc())
                    .then(function () { return param.condition(function (result) { return (result) ? next() : context.ok(); }); })
                    .catch(function (error) { return context.fail(error.message); });
            };
            next();
        });
    }
    exports.dowhile = dowhile;
});
define("core/fail", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_4, script_3) {
    "use strict";
    function fail() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_4.signature(args, [
            { pattern: ["string"], map: function (args) { return ({ message: args[0] }); } },
            { pattern: [], map: function (args) { return ({ message: null }); } },
        ]);
        return script_3.script("core/fail", function (context) {
            if (param.message !== null)
                context.log(param.message);
            context.fail();
        });
    }
    exports.fail = fail;
});
define("core/format", ["require", "exports", "common/tabulate"], function (require, exports, tabulate_1) {
    "use strict";
    var event_format = tabulate_1.tabulate([
        { key: "time", width: 10, pad: 1, map: function (time) { return time.toTimeString(); } },
        { key: "type", width: 10, pad: 1 },
        { key: "task", width: 16, pad: 1 },
        { key: "data", width: 80, wrap: true },
    ]);
    exports.format = function (event) { return event_format(event); };
});
define("core/ifelse", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_5, script_4) {
    "use strict";
    function ifelse() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_5.signature(args, [
            { pattern: ["string", "function", "function", "function"], map: function (args) { return ({ message: args[0], condition: args[1], left: args[2], right: args[3] }); } },
            { pattern: ["function", "function", "function"], map: function (args) { return ({ message: null, condition: args[0], left: args[1], right: args[2] }); } },
        ]);
        return script_4.script("core/ifelse", function (context) {
            param.condition(function (result) {
                var task = (result) ? param.left() : param.right();
                context.run(task)
                    .then(function () { return context.ok(); })
                    .catch(function (error) { return context.fail(error.message); });
            });
        });
    }
    exports.ifelse = ifelse;
});
define("core/ifthen", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_6, script_5) {
    "use strict";
    function ifthen() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_6.signature(args, [
            { pattern: ["string", "function", "function"], map: function (args) { return ({ message: args[0], condition: args[1], taskfunc: args[2] }); } },
            { pattern: ["function", "function"], map: function (args) { return ({ message: null, condition: args[0], taskfunc: args[1] }); } },
        ]);
        return script_5.script("core/ifthen", function (context) {
            if (param.message !== null)
                context.log(param.message);
            param.condition(function (result) {
                if (result === false) {
                    context.ok();
                }
                else {
                    var task = param.taskfunc();
                    context.run(task)
                        .then(function () { return context.ok(); })
                        .catch(function (error) { return context.fail(error.message); });
                }
            });
        });
    }
    exports.ifthen = ifthen;
});
define("core/ok", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_7, script_6) {
    "use strict";
    function ok() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_7.signature(args, [
            { pattern: ["string"], map: function (args) { return ({ info: args[0] }); } },
            { pattern: [], map: function (args) { return ({ info: null }); } },
        ]);
        return script_6.script("core/ok", function (context) {
            if (param.info !== null)
                context.log(param.info);
            context.ok();
        });
    }
    exports.ok = ok;
});
define("core/parallel", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_8, script_7) {
    "use strict";
    function parallel() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_8.signature(args, [
            { pattern: ["string", "array"], map: function (args) { return ({ message: args[0], tasks: args[1] }); } },
            { pattern: ["array"], map: function (args) { return ({ message: null, tasks: args[0] }); } },
        ]);
        return script_7.script("core/parallel", function (context) {
            if (param.message !== null)
                context.log(param.message);
            Promise.all(param.tasks.map(function (task) { return context.run(task); }))
                .then(function () { return context.ok(); })
                .catch(function (error) { return context.fail(error.message); });
        });
    }
    exports.parallel = parallel;
});
define("core/repeat", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_9, script_8) {
    "use strict";
    function repeat() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_9.signature(args, [
            { pattern: ["string", "number", "function"], map: function (args) { return ({ message: args[0], iterations: args[1], taskfunc: args[2] }); } },
            { pattern: ["number", "function"], map: function (args) { return ({ message: null, iterations: args[0], taskfunc: args[1] }); } },
        ]);
        return script_8.script("core/repeat", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var iteration = 0;
            var next = function () {
                if (iteration === param.iterations) {
                    context.ok();
                }
                else {
                    iteration += 1;
                    context.run(param.taskfunc(iteration))
                        .then(function () { return next(); })
                        .catch(function (error) { return context.fail(error.message); });
                }
            };
            next();
        });
    }
    exports.repeat = repeat;
});
define("core/series", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_10, script_9) {
    "use strict";
    function series() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_10.signature(args, [
            { pattern: ["string", "array"], map: function (args) { return ({ message: args[0], tasks: args[1] }); } },
            { pattern: ["array"], map: function (args) { return ({ message: null, tasks: args[0] }); } },
        ]);
        return script_9.script("core/series", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var next = function () {
                if (param.tasks.length === 0) {
                    context.ok();
                }
                else {
                    context.run(param.tasks.shift())
                        .then(next)
                        .catch(function (error) { return context.fail(error.message); });
                }
            };
            next();
        });
    }
    exports.series = series;
});
define("core/timeout", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_11, script_10) {
    "use strict";
    function timeout() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_11.signature(args, [
            { pattern: ["string", "number", "function"], map: function (args) { return ({ message: args[0], ms: args[1], taskfunc: args[2] }); } },
            { pattern: ["number", "function"], map: function (args) { return ({ message: null, ms: args[0], taskfunc: args[1] }); } },
        ]);
        return script_10.script("core/timeout", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var timeout = setTimeout(function () { return context.fail("timeout elapsed."); }, param.ms);
            context.run(param.taskfunc())
                .then(function () { return context.ok(); })
                .catch(function (error) { return context.fail(error.message); });
        });
    }
    exports.timeout = timeout;
});
define("core/trycatch", ["require", "exports", "common/signature", "core/script"], function (require, exports, signature_12, script_11) {
    "use strict";
    function trycatch() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_12.signature(args, [
            { pattern: ["string", "function", "function"], map: function (args) { return ({ message: args[0], left: args[1], right: args[2] }); } },
            { pattern: ["function", "function"], map: function (args) { return ({ message: null, left: args[0], right: args[1] }); } },
        ]);
        return script_11.script("core/trycatch", function (context) {
            if (param.message !== null)
                context.log(param.message);
            context.run(param.left())
                .then(function () { return context.ok(); })
                .catch(function (error) {
                context.run(param.right())
                    .then(function () { return context.ok(); })
                    .catch(function (error) { return context.fail(error.message); });
            });
        });
    }
    exports.trycatch = trycatch;
});
define("node/fs/append", ["require", "exports", "common/signature", "core/script", "fs"], function (require, exports, signature_13, script_12, fs) {
    "use strict";
    function append() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_13.signature(args, [
            { pattern: ["string", "string", "array"], map: function (args) { return ({ message: args[0], target: args[1], content: args[2] }); } },
            { pattern: ["string", "array"], map: function (args) { return ({ message: null, target: args[0], content: args[1] }); } },
        ]);
        return script_12.script("node/fs/append", function (context) {
            if (param.message !== null)
                context.log(param.message);
            try {
                fs.writeFileSync(param.target, [fs.readFileSync(param.target, "utf8"), param.content].join("\n"));
                context.ok();
            }
            catch (error) {
                context.fail(error.message);
            }
        });
    }
    exports.append = append;
});
define("node/fs/concat", ["require", "exports", "common/signature", "core/script", "fs"], function (require, exports, signature_14, script_13, fs) {
    "use strict";
    function concat() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_14.signature(args, [
            { pattern: ["string", "string", "array"], map: function (args) { return ({ message: args[0], target: args[1], sources: args[2] }); } },
            { pattern: ["string", "array"], map: function (args) { return ({ message: null, target: args[0], sources: args[1] }); } },
        ]);
        return script_13.script("node/fs/concat", function (context) {
            if (param.message !== null)
                context.log(param.message);
            try {
                var output = param.sources.map(function (file) { return fs.readFileSync(file, "utf8"); }).join("\n");
                fs.writeFileSync(param.target, output);
                context.ok();
            }
            catch (error) {
                context.fail(error.message);
            }
        });
    }
    exports.concat = concat;
});
define("node/fs/common", ["require", "exports", "path", "fs"], function (require, exports, path, fs) {
    "use strict";
    exports.fs_message = function (context, args) {
        return " - " + [context, args.join(" ")].join(": ");
    };
    exports.fs_error = function (context, message, path) {
        return new Error([context, message, path].join(": "));
    };
    exports.fs_resolve_path = function (p) { return path.resolve(p); };
    exports.fs_info = function (src) {
        var exists = fs.existsSync(src);
        var stat = exists && fs.statSync(src);
        if (src === null || src === undefined) {
            return {
                type: "invalid",
                basename: path.basename(src),
                dirname: path.dirname(src),
                relname: path.normalize('./'),
                stat: null,
            };
        }
        else if (exists === true) {
            if (stat.isDirectory())
                return {
                    type: "directory",
                    basename: path.basename(src),
                    dirname: path.dirname(src),
                    relname: path.normalize('./'),
                    stat: stat
                };
            if (stat.isFile())
                return {
                    type: "file",
                    basename: path.basename(src),
                    dirname: path.dirname(src),
                    relname: path.normalize('./'),
                    stat: stat
                };
        }
        else {
            return {
                type: "empty",
                basename: path.basename(src),
                dirname: path.dirname(src),
                relname: path.normalize('./'),
                stat: null
            };
        }
    };
    exports.fs_tree = function (src) {
        var src_info = exports.fs_info(src);
        switch (src_info.type) {
            case "invalid": throw exports.fs_error("fs_tree", "src path is invalid.", src);
            case "empty": throw exports.fs_error("fs_tree", "src exist doesn't exist.", src);
            case "directory": break;
            case "file": break;
        }
        var buffer = [];
        var seek = function (src, rel) {
            var info = exports.fs_info(src);
            switch (info.type) {
                case "invalid": break;
                case "empty": break;
                case "file":
                    info.relname = rel;
                    buffer.push(info);
                    break;
                case "directory":
                    buffer.push(info);
                    info.relname = path.join(rel, info.basename);
                    var dirname_1 = path.join(info.dirname, info.basename);
                    fs.readdirSync(dirname_1).forEach(function (basename) {
                        return seek(path.join(dirname_1, basename), info.relname);
                    });
                    break;
            }
        };
        seek(src, path.normalize("./"));
        return buffer;
    };
    exports.fs_build_directory = function (directory) {
        var info = exports.fs_info(directory);
        switch (info.type) {
            case "directory": break;
            case "invalid": throw exports.fs_error("fs_build_directory", "directory path is invalid", directory);
            case "file": throw exports.fs_error("fs_build_directory", "directory path points to a file.", directory);
            case "empty":
                var parent_1 = path.dirname(directory);
                if (fs.existsSync(parent_1) === false)
                    exports.fs_build_directory(parent_1);
                fs.mkdirSync(path.join(info.dirname, info.basename));
                break;
        }
    };
    exports.fs_copy_file = function (src, dst) {
        var src_info = exports.fs_info(src);
        var dst_info = exports.fs_info(dst);
        switch (src_info.type) {
            case "empty": throw exports.fs_error("fs_copy_file", "src file path doesn't exist.", src);
            case "invalid": throw exports.fs_error("fs_copy_file", "src file path is invalid.", src);
            case "directory": throw exports.fs_error("fs_copy_file", "attempted to link a directory", src);
            case "file": break;
        }
        switch (dst_info.type) {
            case "directory": throw exports.fs_error("fs_copy_file", "dst file path found directory named the same.", dst);
            case "invalid": throw exports.fs_error("fs_copy_file", "dst file path is invalid.", dst);
            case "empty":
            case "file":
                exports.fs_build_directory(dst_info.dirname);
                var source = path.join(src_info.dirname, src_info.basename);
                var target = path.join(dst_info.dirname, dst_info.basename);
                if (source !== target) {
                    if (dst_info.type === "file")
                        fs.unlinkSync(target);
                    fs.linkSync(source, target);
                }
                break;
        }
    };
});
define("node/fs/copy", ["require", "exports", "common/signature", "core/script", "node/fs/common", "path"], function (require, exports, signature_15, script_14, common, path) {
    "use strict";
    function copy() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_15.signature(args, [
            { pattern: ["string", "string", "string"], map: function (args) { return ({ message: args[0], src: args[1], directory: args[2] }); } },
            { pattern: ["string", "string"], map: function (args) { return ({ message: null, src: args[0], directory: args[1] }); } },
        ]);
        return script_14.script("node/fs/copy", function (context) {
            if (param.message !== null)
                context.log(param.message);
            try {
                var src_1 = common.fs_resolve_path(param.src);
                var dst = common.fs_resolve_path(param.directory);
                var dst_info_1 = common.fs_info(dst);
                var gather = common.fs_tree(src_1);
                gather.forEach(function (src_info) {
                    switch (src_info.type) {
                        case "invalid": throw common.fs_error("copy", "invalid file or directory src path.", src_1);
                        case "empty": throw common.fs_error("copy", "no file or directory exists at the given src.", src_1);
                        case "directory":
                            var directory = path.join(dst_info_1.dirname, dst_info_1.basename, src_info.relname);
                            context.log(common.fs_message("mkdir", [directory]));
                            common.fs_build_directory(directory);
                            break;
                        case "file":
                            var source = path.join(src_info.dirname, src_info.basename);
                            var target = path.join(dst_info_1.dirname, dst_info_1.basename, src_info.relname, src_info.basename);
                            context.log(common.fs_message("copy", [source, target]));
                            common.fs_copy_file(source, target);
                            break;
                    }
                });
                context.ok();
            }
            catch (error) {
                context.fail(error.message);
            }
        });
    }
    exports.copy = copy;
});
define("node/fs/drop", ["require", "exports", "common/signature", "core/script", "node/fs/common", "path", "fs"], function (require, exports, signature_16, script_15, common, path, fs) {
    "use strict";
    function drop() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_16.signature(args, [
            { pattern: ["string", "string"], map: function (args) { return ({ message: args[0], target: args[1] }); } },
            { pattern: ["string"], map: function (args) { return ({ message: null, target: args[0] }); } },
        ]);
        return script_15.script("node/fs/drop", function (context) {
            if (param.message !== null)
                context.log(param.message);
            try {
                var src = common.fs_resolve_path(param.target);
                var dst_info = common.fs_info(src);
                var gather = common.fs_tree(src);
                gather.reverse();
                gather.forEach(function (src_info) {
                    switch (src_info.type) {
                        case "empty": break;
                        case "invalid": break;
                        case "directory":
                            var directory = path.join(src_info.dirname, src_info.basename);
                            context.log(common.fs_message("drop", [directory]));
                            fs.rmdirSync(directory);
                            break;
                        case "file":
                            var filename = path.join(src_info.dirname, src_info.basename);
                            context.log(common.fs_message("drop", [filename]));
                            fs.unlinkSync(filename);
                    }
                });
                context.ok();
            }
            catch (error) {
                context.fail(error.message);
            }
        });
    }
    exports.drop = drop;
});
define("node/watch", ["require", "exports", "common/signature", "core/script", "fs"], function (require, exports, signature_17, script_16, fs_1) {
    "use strict";
    function watch() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_17.signature(args, [
            { pattern: ["string", "string", "function"], map: function (args) { return ({ message: args[0], path: args[1], taskfunc: args[2] }); } },
            { pattern: ["string", "function"], map: function (args) { return ({ message: null, path: args[0], taskfunc: args[1] }); } }
        ]);
        return script_16.script("node/watch", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var waiting_on_signal = true;
            var runtask = function () {
                if (waiting_on_signal === true) {
                    waiting_on_signal = false;
                    var task = param.taskfunc();
                    context.run(task)
                        .then(function () { waiting_on_signal = true; })
                        .catch(function (error) { return context.fail(error.message); });
                }
            };
            fs_1.watch(param.path, function (event, filename) { return runtask(); });
        });
    }
    exports.watch = watch;
});
define("node/cli", ["require", "exports", "core/script"], function (require, exports, script_17) {
    "use strict";
    exports.cli = function (argv, tasks) { return script_17.script("node/cli", function (context) {
        var args = process.argv.reduce(function (acc, c, index) {
            if (index > 1)
                acc.push(c);
            return acc;
        }, []);
        if (args.length !== 1 || tasks[args[0]] === undefined) {
            context.log("tasks:");
            Object.keys(tasks).forEach(function (key) { return context.log(" - ", key); });
            context.ok();
        }
        else {
            var task = tasks[args[0]];
            context.log("running: [" + args[0] + "]");
            context.run(task).then(function (_) { return context.ok(); })
                .catch(function (error) { return context.fail(error.message); });
        }
    }); };
});
define("node/shell", ["require", "exports", "common/signature", "core/script", "child_process"], function (require, exports, signature_18, script_18, child_process_1) {
    "use strict";
    function shell() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var param = signature_18.signature(args, [
            { pattern: ["string", "string", "number"], map: function (args) { return ({ message: args[0], command: args[1], exitcode: args[2] }); } },
            { pattern: ["string", "number"], map: function (args) { return ({ message: null, command: args[0], exitcode: args[1] }); } },
            { pattern: ["string", "string"], map: function (args) { return ({ message: args[0], command: args[1], exitcode: 0 }); } },
            { pattern: ["string"], map: function (args) { return ({ message: null, command: args[0], exitcode: 0 }); } },
        ]);
        return script_18.script("node/shell", function (context) {
            if (param.message !== null)
                context.log(param.message);
            var windows = /^win/.test(process.platform);
            var proc = child_process_1.spawn(windows ? 'cmd' : 'sh', [windows ? '/c' : '-c', param.command]);
            proc.stdout.setEncoding("utf8");
            proc.stdout.on("data", function (data) { return context.log(data); });
            proc.stdout.on("error", function (error) { return context.fail(error.toString); });
            proc.on("error", function (error) { return context.fail(error.toString); });
            proc.on("close", function (code) {
                setTimeout(function () {
                    (param.exitcode !== code)
                        ? context.fail("shell: unexpected exit code. expected", param.exitcode, " got ", code)
                        : context.ok();
                }, 100);
            });
        });
    }
    exports.shell = shell;
});
define("tasksmith", ["require", "exports", "common/signature", "common/tabulate", "core/delay", "core/dowhile", "core/fail", "core/format", "core/ifelse", "core/ifthen", "core/ok", "core/parallel", "core/repeat", "core/script", "core/series", "core/task", "core/timeout", "core/trycatch", "node/fs/append", "node/fs/concat", "node/fs/copy", "node/fs/drop", "node/watch", "node/cli", "node/shell"], function (require, exports, signature_19, tabulate_2, delay_1, dowhile_1, fail_1, format_1, ifelse_1, ifthen_1, ok_1, parallel_1, repeat_1, script_19, series_1, task_2, timeout_1, trycatch_1, append_1, concat_1, copy_1, drop_1, watch_1, cli_1, shell_1) {
    "use strict";
    exports.signature = signature_19.signature;
    exports.tabulate = tabulate_2.tabulate;
    exports.delay = delay_1.delay;
    exports.dowhile = dowhile_1.dowhile;
    exports.fail = fail_1.fail;
    exports.format = format_1.format;
    exports.ifelse = ifelse_1.ifelse;
    exports.ifthen = ifthen_1.ifthen;
    exports.ok = ok_1.ok;
    exports.parallel = parallel_1.parallel;
    exports.repeat = repeat_1.repeat;
    exports.script = script_19.script;
    exports.series = series_1.series;
    exports.Task = task_2.Task;
    exports.timeout = timeout_1.timeout;
    exports.trycatch = trycatch_1.trycatch;
    exports.append = append_1.append;
    exports.concat = concat_1.concat;
    exports.copy = copy_1.copy;
    exports.drop = drop_1.drop;
    exports.watch = watch_1.watch;
    exports.cli = cli_1.cli;
    exports.shell = shell_1.shell;
});

module.exports = __collect();