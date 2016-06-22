define(["require", "exports", "./indexed/index", "./indexed_dir/index"], function (require, exports, indexed, indexed_dir) {
    "use strict";
    function test() {
        indexed.test();
        indexed_dir.test();
    }
    exports.test = test;
});
