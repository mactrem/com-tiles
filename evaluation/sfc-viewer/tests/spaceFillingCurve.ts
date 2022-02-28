/*
 * -> Client decides which chunk size of the index he requests -> 500k chunks
 *    -> use the center of the map and add a buffer
 * Zoom 9
 * -> average number of tiles?
 * ->
 *
 * */

//Hilbert -> number of range / cluster requests
//tiles in Z9 for munich as center -> TMS tiling scheme (y-axis down)
//268, 336 -> 275, 336
//268, 335 -> 275, 335
//268, 334 -> 275, 334
//268, 333 -> 275, 333
//268, 332 -> 275, 332

const hilbertCurve = require("hilbert-curve");

const tiles = [];
for (const row of [332, 333, 334, 335, 336]) {
  for (let column = 268; column <= 275; column++) {
    tiles.push([column, row]);
  }
}

const indices = [];
for (const tile of tiles) {
  const index = hilbertCurve.pointToIndex({ x: tile[0], y: tile[1] }, 9);
  indices.push(index);
  console.log(index);
}

let numRanges = 0;
for (const index of indices) {
  if (!indices.includes(index - 1) || !indices.includes(index + 1)) {
    numRanges++;
  }
}

const min = Math.min(...indices);
const max = Math.max(...indices);

console.log("Min: " + min);
console.log("Max: " + max);
console.log("Delta: " + (max - min));
console.log("Size: " + (max - min) * 8);
console.log("Num ranges: " + numRanges);
