import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";

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

/**
 *
 * @param index Index on a row-major space-filling curve
 * @param tileMatrixSet Ordered in ascending order regarding the zoom level.
 * A TileMatrix of the tileMatrixSet may not be fragmented (aggregationCoefficient not equal to -1).
 */
export function getXyzIndexFromUnfragmentedRowMajorOrder(
    index: number,
    tileMatrixSet: TileMatrix[],
): { x: number; y: number; z: number } {
    if (!tileMatrixSet.every((tileMatrix) => tileMatrix.aggregationCoefficient === -1)) {
        throw new Error("Every TileMatrix of the TileMatrixSet may not be fragmented");
    }

    const z = getZoom(index, tileMatrixSet);
    const numTilesBeforeZoom = tileMatrixSet
        .filter((tileMatrix) => tileMatrix.zoom < z)
        .reduce((numTiles, { tileMatrixLimits: limits }) => {
            return numTiles + (limits.maxTileRow - limits.minTileRow + 1) * (limits.maxTileCol - limits.minTileCol + 1);
        }, 0);

    const currentZoomIndex = index - numTilesBeforeZoom;
    const tileMatrix = tileMatrixSet[z].tileMatrixLimits;
    const numCols = tileMatrix.maxTileCol - tileMatrix.minTileCol + 1;
    const y = Math.floor(currentZoomIndex / numCols);
    const x = currentZoomIndex - y * numCols;

    return { x, y, z };
}

function getZoom(index: number, tileMatrixSet: TileMatrix[]): number {
    let nextZoomStartIndex = 1;
    for (let i = 0; i < tileMatrixSet.length; i++) {
        nextZoomStartIndex += i ** 4;
        if (index < nextZoomStartIndex) {
            return i;
        }
    }
}

/**
 *
 * Calculates the number of tiles for the given tileMatrixSet.
 *
 * @param tileMatrixSet Ordered in ascending order regarding the zoom level
 */
export function calculateNumTiles(tileMatrixSet: TileMatrix[]): number {
    return tileMatrixSet.reduce((numTiles, { tileMatrixLimits: limits }) => {
        return numTiles + (limits.maxTileRow - limits.minTileRow + 1) * (limits.maxTileCol - limits.minTileCol + 1);
    }, 0);
}
