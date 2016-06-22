define("indexed/mod0", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("indexed: mod0");
    }
    exports.test = test;
});
define("indexed/mod1", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("indexed: mod1");
    }
    exports.test = test;
});
define("indexed/mod2", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("indexed: mod2");
    }
    exports.test = test;
});
define("indexed/index", ["require", "exports", "indexed/mod0", "indexed/mod1", "indexed/mod2"], function (require, exports, mod0, mod1, mod2) {
    "use strict";
    function test() {
        log("indexed: index");
        mod0.test();
        mod1.test();
        mod2.test();
    }
    exports.test = test;
});
define("indexed_dir/mod0/mod", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("indexed_dir: mod0");
    }
    exports.test = test;
});
define("indexed_dir/mod1/mod", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("indexed_dir: mod1");
    }
    exports.test = test;
});
define("indexed_dir/mod2/mod", ["require", "exports", "indexed_dir/mod0/mod", "indexed_dir/mod1/mod"], function (require, exports, mod0, mod1) {
    "use strict";
    function test() {
        log("indexed_dir: mod2");
        mod0.test();
        mod1.test();
    }
    exports.test = test;
});
define("indexed_dir/index", ["require", "exports", "indexed_dir/mod0/mod", "indexed_dir/mod1/mod", "indexed_dir/mod2/mod"], function (require, exports, mod0, mod1, mod2) {
    "use strict";
    function test() {
        log("indexed_dir: index");
        mod0.test();
        mod1.test();
        mod2.test();
    }
    exports.test = test;
});
define("errors/inside", ["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("error-inside: test");
        __undefined("should error");
    }
    exports.test = test;
});
define("errors/outside", ["require", "exports"], function (require, exports) {
    "use strict";
    __undefined("should error");
    function test() {
        log("error-outside: test");
    }
    exports.test = test;
});
define("errors/index", ["require", "exports", "errors/inside", "errors/outside"], function (require, exports, inside, outside) {
    "use strict";
    function test() {
        log("error: test");
        inside.test();
        outside.test();
    }
    exports.test = test;
});
define("app", ["require", "exports", "indexed/index", "indexed_dir/index"], function (require, exports, indexed, indexed_dir) {
    "use strict";
    function test() {
        indexed.test();
        indexed_dir.test();
    }
    exports.test = test;
});
