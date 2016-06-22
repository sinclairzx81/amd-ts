define(["require", "exports", "./mod0", "./mod1", "./mod2"], function (require, exports, mod0, mod1, mod2) {
    "use strict";
    function test() {
        log("indexed: index");
        mod0.test();
        mod1.test();
        mod2.test();
    }
    exports.test = test;
});
