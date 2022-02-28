export default function tileCoordToIndex(x: number, y: number, zoom: number) {
  //TODO: start with zero
  //Max index columns/rows
  const n = 2 ** zoom;
  return n * y + x;
}
