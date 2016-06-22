define(["require", "exports", "./inside", "./outside"], function (require, exports, inside, outside) {
    "use strict";
    function test() {
        log("error: test");
        inside.test();
        outside.test();
    }
    exports.test = test;
});
