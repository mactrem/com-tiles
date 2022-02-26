export function toBytesLE(num: number, numBytes = 5): Buffer {
    const buffer = Buffer.alloc(numBytes);
    const convert = numBytes <= 4 ? convertInt : convertBigInt;

    for (let bytePosition = 0; bytePosition < numBytes; bytePosition++) {
        buffer[bytePosition] = convert(bytePosition, num);
    }

    return buffer;
}

function convertInt(bytePosition: number, num: number): number {
    const numBitsToShift = bytePosition * 8;
    const mask = 0xff << numBitsToShift;
    return (num & mask) >> numBitsToShift;
}

function convertBigInt(bytePosition: number, num: number): number {
    /* Before a bitwise operation is performed, JavaScript converts numbers to 32 bits signed integers */
    const bigNum = BigInt(num);
    const numBitsToShift = BigInt(bytePosition * 8);
    const mask = BigInt(0xff) << numBitsToShift;
    return Number((bigNum & mask) >> numBitsToShift);
}
