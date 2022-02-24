"use strict";
exports.__esModule = true;
exports.toBytesLE = void 0;
function toBytesLE(num, numBytes) {
    if (numBytes === void 0) { numBytes = 5; }
    var buffer = Buffer.alloc(numBytes);
    if (numBytes <= 4) {
        for (var i = 0; i < numBytes; i++) {
            var numBitsToShift = i * 8;
            var mask = 0xff << numBitsToShift;
            buffer[i] = (num & mask) >> numBitsToShift;
        }
    }
    else {
        //TODO: quick and dirty approach -> refactor
        /* Before a bitwise operation is performed, JavaScript converts numbers to 32 bits signed integers */
        for (var i = 0; i < numBytes; i++) {
            var bigNum = BigInt(num);
            var numBitsToShift = BigInt(i * 8);
            var mask = BigInt(0xff) << numBitsToShift;
            buffer[i] = Number((bigNum & mask) >> numBitsToShift);
        }
    }
    return buffer;
}
exports.toBytesLE = toBytesLE;
