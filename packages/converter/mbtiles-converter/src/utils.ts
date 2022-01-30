export function toBytesLE(num: number, numBytes = 5): Buffer {
  const buffer = Buffer.alloc(numBytes);
  if (numBytes <= 4) {
    for (let i = 0; i < numBytes; i++) {
      const numBitsToShift = i * 8;
      const mask = 0xff << numBitsToShift;
      buffer[i] = (num & mask) >> numBitsToShift;
    }
  } else {
    //TODO: quick and dirty approach -> refactor
    /* Before a bitwise operation is performed, JavaScript converts numbers to 32 bits signed integers */
    for (let i = 0; i < numBytes; i++) {
      const bigNum = BigInt(num);
      const numBitsToShift = BigInt(i * 8);
      const mask = BigInt(0xff) << numBitsToShift;
      buffer[i] = Number((bigNum & mask) >> numBitsToShift);
    }
  }

  return buffer;
}
