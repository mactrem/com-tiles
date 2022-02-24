import { Metadata } from "@comt/spec";
import { TileMatrix } from "@comt/spec/types/tileMatrix";

type TileMatrixLimits = TileMatrix["tileMatrixLimits"];

export interface FragmentRange {
    index;
    startOffset: number;
    endOffset: number;
}

export default class ComtIndex {
    private static readonly NUM_BYTES_TILE_SIZE = 4;
    private static readonly Supported_TILE_MATRIX_CRS = "WebMercatorQuad";
    private static readonly SUPPORTED_ORDERING = [undefined, "RowMajor"];
    private readonly tileMatrixSet: Metadata["tileMatrixSet"];

    constructor(private readonly metadata: Metadata) {
        this.tileMatrixSet = metadata.tileMatrixSet;

        if (
            ![this.tileMatrixSet.fragmentOrdering, this.tileMatrixSet.tileOrdering].every((ordering) =>
                ComtIndex.SUPPORTED_ORDERING.some((o) => o === ordering),
            )
        ) {
            throw new Error(`The only supported fragment and tile ordering is ${ComtIndex.SUPPORTED_ORDERING}`);
        }

        if (
            this.tileMatrixSet.tileMatrixCRS !== undefined &&
            this.tileMatrixSet?.tileMatrixCRS.trim().toLowerCase() !== ComtIndex.Supported_TILE_MATRIX_CRS.toLowerCase()
        ) {
            throw new Error(`The only supported TileMatrixCRS is ${ComtIndex.Supported_TILE_MATRIX_CRS}.`);
        }
    }

    /**
     *
     * @param zoom
     * @param x
     * @param y
     */
    getFragmentRangeForTile(zoom: number, x: number, y: number): FragmentRange {
        const numBytesForTileOffset = this.metadata.tileOffsetBytes ?? 5;
        const indexEntrySize = numBytesForTileOffset + ComtIndex.NUM_BYTES_TILE_SIZE;
        const filteredSet = this.tileMatrixSet.tileMatrix.filter((t) => t.zoom <= zoom);

        let startIndex = 0;
        let endIndex = 0;
        for (const ts of filteredSet) {
            const limit = ts.tileMatrixLimits;
            if (ts.zoom === zoom && !this.inRange(x, y, limit)) {
                throw new Error("Specified tile index not part of the TileSet.");
            }

            if (ts.zoom < zoom) {
                const numTiles = (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow + 1);
                startIndex += numTiles;
            } else {
                /*
                 * Calculates the index based on a space filling curve with row-major order with origin on the lower left side
                 * like specified in the MBTiles spec
                 * */
                //TODO: refactor to use XYZ instead of TMS like specified the OGC WebMercatorQuad TileMatrixSet

                /*
                 * First calculate the number of tiles before the fragment which contains the specified tile
                 * 1. Calculate the number of tiles which are on the left side of the fragment
                 * 2. Calculate the number of tiles which are below the the fragment of the specified tile
                 *  ________________
                 * |   |_4._|T|     |
                 * |   |__3.__|_____|
                 * |   |            |
                 * | 1.|      2.    |
                 * |___|____________|
                 *
                 * */
                const numTilesPerFragmentSide = 2 ** ts.aggregationCoefficient;
                const minTileColFragment = Math.floor(x / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                const minTileRowFragment = Math.floor(y / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                const fragmentBoundsOfSpecifiedTileGlobalTilCrs = {
                    minTileCol: minTileColFragment,
                    minTileRow: minTileRowFragment,
                    maxTileCol: minTileColFragment + numTilesPerFragmentSide - 1,
                    maxTileRow: minTileRowFragment + numTilesPerFragmentSide - 1,
                };
                const sparseFragmentsBounds = this.calculateFragmentBounds(
                    limit,
                    fragmentBoundsOfSpecifiedTileGlobalTilCrs,
                );

                // 1.
                const leftNumTilesBeforeFragment =
                    (sparseFragmentsBounds.minTileCol - limit.minTileCol) *
                    (sparseFragmentsBounds.maxTileRow - limit.minTileRow + 1);

                // 2.
                const lowerNumTilesBeforeFragment =
                    (limit.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
                    (sparseFragmentsBounds.minTileRow - limit.minTileRow);

                // 3. number of tiles in fragment
                const numTilesInFragment =
                    (sparseFragmentsBounds.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
                    (sparseFragmentsBounds.maxTileRow - sparseFragmentsBounds.minTileRow + 1);

                const numTiles = leftNumTilesBeforeFragment + lowerNumTilesBeforeFragment;
                startIndex += numTiles;
                endIndex = startIndex + numTilesInFragment - 1;
            }
        }

        const offset = startIndex * indexEntrySize;
        const endOffset = (endIndex + 1) * indexEntrySize;
        return { index: startIndex, startOffset: offset, endOffset };
    }

    /**
     * Calculates the offset in the index (IndexEntry) for the specified tile based on the metadata.
     * This method can be used when the full index is kept in memory.
     * If this not the case use index fragments to query parts of the index.
     *
     * @param zoom
     * @param x
     * @param y
     */
    //TODO: refactor to only support RowMajor order and WebMercator TileMatrixCRS
    calculateIndexOffsetForTile(zoom: number, x: number, y: number): [offset: number, index: number] {
        const numBytesForTileOffset = this.metadata.tileOffsetBytes ?? 5;
        const indexEntrySize = numBytesForTileOffset + ComtIndex.NUM_BYTES_TILE_SIZE;
        let offset = 0;
        const filteredSet = this.tileMatrixSet.tileMatrix.filter((t) => t.zoom <= zoom);
        for (const ts of filteredSet) {
            const limit = ts.tileMatrixLimits;
            if (ts.zoom === zoom && !this.inRange(x, y, limit)) {
                throw new Error("Specified tile index not part of the TileSet.");
            }

            if (ts.zoom < zoom) {
                const numTiles = (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow + 1);
                offset += numTiles * indexEntrySize;
            } else {
                /*
                 * Calculates the index based on a space filling curve with row-major order with origin on the lower left side
                 * like specified in the MBTiles spec
                 * */
                //TODO: refactor to use XYZ instead of TMS like specified the OGC WebMercatorQuad TileMatrixSet
                if (ts.aggregationCoefficient === -1) {
                    const numRows = y - limit.minTileRow;
                    const numCols = limit.maxTileCol - limit.minTileCol + 1;
                    const deltaCol = x - limit.minTileCol;
                    offset += (numRows > 0 ? numRows * numCols + deltaCol : deltaCol) * indexEntrySize;
                } else {
                    /*
                     * First calculate the number of tiles before the fragment which contains the specified tile
                     * 1. Calculate the number of tiles which are on the left side of the fragment
                     * 2. Calculate the number of tiles which are below the the fragment of the specified tile
                     * Then calculate the number of tiles before the specified tile in the fragment
                     * 3. Number of tiles for the full rows in the fragment which contains the specified tile
                     * 4. Number of tiles before the specified tile in the partial row of the fragment
                     *  ________________
                     * |   |_4._|T|     |
                     * |   |__3.__|_____|
                     * |   |            |
                     * | 1.|      2.    |
                     * |___|____________|
                     *
                     * */
                    const numTilesPerFragmentSide = 2 ** ts.aggregationCoefficient;
                    const minTileColFragment = Math.floor(x / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                    const minTileRowFragment = Math.floor(y / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                    const fragmentBoundsOfSpecifiedTileGlobalTilCrs = {
                        minTileCol: minTileColFragment,
                        minTileRow: minTileRowFragment,
                        maxTileCol: minTileColFragment + numTilesPerFragmentSide - 1,
                        maxTileRow: minTileRowFragment + numTilesPerFragmentSide - 1,
                    };
                    const sparseFragmentsBounds = this.calculateFragmentBounds(
                        limit,
                        fragmentBoundsOfSpecifiedTileGlobalTilCrs,
                    );

                    // 1.
                    const leftNumTilesBeforeFragment =
                        (sparseFragmentsBounds.minTileCol - limit.minTileCol) *
                        (sparseFragmentsBounds.maxTileRow - limit.minTileRow + 1);

                    // 2.
                    const lowerNumTilesBeforeFragment =
                        (limit.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
                        (sparseFragmentsBounds.minTileRow - limit.minTileRow);

                    // 3. full rows in fragment
                    const numTilesFullRows =
                        (y - sparseFragmentsBounds.minTileRow) *
                        (sparseFragmentsBounds.maxTileCol - sparseFragmentsBounds.minTileCol + 1);

                    // 4. partial row in fragment
                    const partialTiles = x - sparseFragmentsBounds.minTileCol;

                    const numTiles =
                        leftNumTilesBeforeFragment + lowerNumTilesBeforeFragment + numTilesFullRows + partialTiles;
                    offset += numTiles * indexEntrySize;
                }
            }
        }

        const index = offset / indexEntrySize;
        return [offset, index];
    }

    private inRange(x: number, y: number, tileSetLimits: TileMatrixLimits): boolean {
        return (
            x >= tileSetLimits.minTileCol &&
            x <= tileSetLimits.maxTileCol &&
            y >= tileSetLimits.minTileRow &&
            y <= tileSetLimits.maxTileRow
        );
    }

    private calculateFragmentBounds(tileSetLimits: TileMatrixLimits, denseFragmentLimits: TileMatrixLimits) {
        const intersectedLimits = { ...denseFragmentLimits };
        if (tileSetLimits.minTileCol > denseFragmentLimits.minTileCol) {
            intersectedLimits.minTileCol = tileSetLimits.minTileCol;
        }
        if (tileSetLimits.minTileRow > denseFragmentLimits.minTileRow) {
            intersectedLimits.minTileRow = tileSetLimits.minTileRow;
        }
        if (tileSetLimits.maxTileCol < denseFragmentLimits.maxTileCol) {
            intersectedLimits.maxTileCol = tileSetLimits.maxTileCol;
        }
        if (tileSetLimits.maxTileRow < denseFragmentLimits.maxTileRow) {
            intersectedLimits.maxTileRow = tileSetLimits.maxTileRow;
        }
        return intersectedLimits;
    }
}
