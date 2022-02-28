/* const y = 4; //100101 -> 37
const y = 7; //111111 -> 63*/

export default function pointToIndex(x: number, y: number, zoom: number) {
  //Max index columns/rows
  const n = 2 ** zoom - 1;

  const numBits = getNumberOfBits(n);

  /*
   *
   * x: 00001 -> 0
   * y: 00001 -> 1
   * x: 00010 -> 2 -> 101
   * y: 00010 -> 3
   * */

  let mortonCode = 0;
  for (let i = 0; i < numBits; i++) {
    if (((2 ** i) & x) > 0) {
      mortonCode = mortonCode | (1 << (i * 2));
    }

    if (((2 ** i) & y) > 0) {
      mortonCode = mortonCode | (1 << (i * 2 + 1));
    }

    //mortonCode = mortonCode | ((2**i) & x) << (i*2);
    //mortonCode = mortonCode | ((2**i) & y) << (i*2+1);
  }

  //console.log(mortonCode);
  return mortonCode;
}

function getNumberOfBits(n: number) {
  // 001 -> 2*0
  // 010 -> 2*1
  // 100 -> 2*2

  //In JS binary bitwise operators convert one of their operands to a 32-bit integer
  for (let numBits = 1; numBits <= 32; numBits++) {
    const numCombinations = 2 ** numBits;
    const maxNumber = numCombinations - 1;
    if (maxNumber >= n) {
      return numBits;
    }
  }

  throw Error("Out of range.");
}
