define(["require", "exports", "./mod0/mod", "./mod1/mod", "./mod2/mod"], function (require, exports, mod0, mod1, mod2) {
    "use strict";
    function test() {
        log("indexed_dir: index");
        mod0.test();
        mod1.test();
        mod2.test();
    }
    exports.test = test;
});
