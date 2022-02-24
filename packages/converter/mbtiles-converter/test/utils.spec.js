"use strict";
exports.__esModule = true;
var utils_1 = require("../src/utils");
describe("toBytesLE", function () {
    it("should convert 4 bytes", function () {
        // 11100 11100101 11011010
        // 28    229      218
        var num = 1893850;
        var actualBuffer = (0, utils_1.toBytesLE)(num, 4);
        expect(actualBuffer.length).toBe(4);
        expect(actualBuffer[0]).toBe(218);
        expect(actualBuffer[1]).toBe(229);
        expect(actualBuffer[2]).toBe(28);
        expect(actualBuffer[3]).toBe(0);
    });
    it("should convert 5 bytes", function () {
        // 1110110 01111001 01000110 11000001
        // 118     121       70       193
        var num = 1987659457;
        var actualBuffer = (0, utils_1.toBytesLE)(num);
        expect(actualBuffer.length).toBe(5);
        expect(actualBuffer[0]).toBe(193);
        expect(actualBuffer[1]).toBe(70);
        expect(actualBuffer[2]).toBe(121);
        expect(actualBuffer[3]).toBe(118);
        expect(actualBuffer[4]).toBe(0);
    });
});
