define(["require", "exports"], function (require, exports) {
    "use strict";
    function test() {
        log("error-inside: test");
        __undefined("should error");
    }
    exports.test = test;
});
