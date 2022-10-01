import { Metadata } from "@com-tiles/spec";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";

type TileMatrixLimits = TileMatrix["tileMatrixLimits"];

export interface FragmentRange {
    index: number;
    startOffset: number;
    endOffset: number;
}

export default class ComtIndex {
    private static readonly NUM_BYTES_ABSOLUTE_OFFSET = 5;
    private static readonly NUM_BYTES_TILE_SIZE = 3;
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

    //TODO: implement again
    getFragmentRangeForTile(zoom: number, x: number, y: number): FragmentRange {
        return null;
    }

    //TODO: implement again
    calculateIndexOffsetForTile(zoom: number, x: number, y: number): { offset: number; index: number } {
        return null;
    }

    //TODO: refactor and rename
    calculateIndexFragmentSection(zoom: number, x: number, y: number): { offset: number; index: number } {
        return this.tileMatrixSet.tileMatrix
            .filter((tm) => tm.zoom <= zoom && this.metadata.tileMatrixSet.tileMatrix[zoom].aggregationCoefficient > -1)
            .reduce(
                (stats: { offset: number; index: number }, ts) => {
                    const limit = ts.tileMatrixLimits;
                    if (ts.zoom === zoom && !this.inRange(x, y, limit)) {
                        throw new Error("Specified tile index not part of the TileSet.");
                    }

                    if (ts.zoom < zoom) {
                        const index =
                            (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow + 1);
                        //TODO: use constants
                        //tile bounds of tile matrix -> Dense fragment bounds in the global fragmentCrs
                        const fragmentsPerZoom = this.calculateNumberFragmentsPerZoom(limit, ts.aggregationCoefficient);
                        const offset = fragmentsPerZoom * 5 + index * 3;
                        return { offset, index };
                    } else {
                        /*
                         * Calculates the index based on a space filling curve with row-major order with origin on the lower left side
                         * (TMS tiling scheme) like specified in the MBTiles spec
                         * */
                        /*if (ts.aggregationCoefficient === -1) {
                        const numRows = y - limit.minTileRow;
                        const numCols = limit.maxTileCol - limit.minTileCol + 1;
                        const deltaCol = x - limit.minTileCol;
                        return (
                            offset + (numRows > 0 ? numRows * numCols + deltaCol : deltaCol) * this.indexEntryByteLength
                        );
                    } else {*/
                        /*
                         * Calculate the number of index entries before the fragment which contains the specified tile
                         * 1. Calculate the number of index entries which are on the left side of the fragment
                         * 2. Calculate the number of index entries which are below the fragment of the specified tile
                         * Calculate the number of index entries before the specified tile in the fragment
                         * 3. Calculate the number of index entries for the full rows in the fragment which contains the specified tile
                         * 4. Calculate the number of index entries before the specified tile in the partial row of the fragment
                         *  ________________
                         * |   |_4._|T|     |
                         * |   |__3.__|_____|
                         * | 1.|      2.    |
                         * |___|____________|
                         * */
                        const sparseFragmentsBounds = this.calculateSparseFragmentBounds(
                            x,
                            y,
                            ts.aggregationCoefficient,
                            limit,
                        );

                        const numberOfIndexEntriesBeforeFragment = this.numberOfIndexEntriesBeforeFragment(
                            sparseFragmentsBounds,
                            limit,
                        );

                        /* Calculate number of index entries for the full rows in the fragment which contains the specified tile */
                        const numTilesFullRows =
                            (y - sparseFragmentsBounds.minTileRow) *
                            (sparseFragmentsBounds.maxTileCol - sparseFragmentsBounds.minTileCol + 1);

                        /* Calculate the number of index entries before the specified tile in the partial row of the fragment */
                        const partialTiles = x - sparseFragmentsBounds.minTileCol;

                        const index = numberOfIndexEntriesBeforeFragment + numTilesFullRows + partialTiles;

                        const denseFragmentBounds = this.calculateDenseFragmentBounds(ts.aggregationCoefficient, limit);
                        const numberOfFragmentsBefore = this.calculateNumberOfFragmentsBefore(
                            x,
                            y,
                            denseFragmentBounds,
                            ts.aggregationCoefficient,
                        );

                        //TODO: refactor -> use constants
                        const offset = stats.offset + numberOfFragmentsBefore * 5 + index * 3;
                        return { offset, index };
                    }
                },
                { offset: 0, index: 0 },
            );
    }

    private inRange(x: number, y: number, tileSetLimits: TileMatrixLimits): boolean {
        return (
            x >= tileSetLimits.minTileCol &&
            x <= tileSetLimits.maxTileCol &&
            y >= tileSetLimits.minTileRow &&
            y <= tileSetLimits.maxTileRow
        );
    }

    private calculateNumberFragmentsPerZoom(limit: TileMatrixLimits, aggregationCoefficient: number): number {
        const numTilesPerFragmentSide = 2 ** aggregationCoefficient;
        const minTileColFragmentIndex = Math.floor(limit.minTileCol / numTilesPerFragmentSide);
        const minTileRowFragmentIndex = Math.floor(limit.minTileRow / numTilesPerFragmentSide);
        const maxTileColFragmentIndex = Math.floor(limit.maxTileCol / numTilesPerFragmentSide);
        const maxTileRowFragmentIndex = Math.floor(limit.maxTileRow / numTilesPerFragmentSide);

        /*
         * 0-0,0-0 -> 1
         * 0-1,0-1 -> 4
         * 1-4, 1-3 -> 12
         * */
        //TODO: refactor and write test
        return (
            (maxTileColFragmentIndex - minTileColFragmentIndex + 1) *
            (maxTileRowFragmentIndex - minTileRowFragmentIndex + 1)
        );
    }

    //TODO: refactor -> merge with sparse calculation
    private calculateDenseFragmentBounds(aggregationCoefficient: number, limit: TileMatrixLimits) {
        const numTilesPerFragmentSide = 2 ** aggregationCoefficient;
        const minTileColFragment = Math.floor(limit.minTileCol / numTilesPerFragmentSide) * numTilesPerFragmentSide;
        const minTileRowFragment = Math.floor(limit.minTileRow / numTilesPerFragmentSide) * numTilesPerFragmentSide;
        return {
            minTileCol: minTileColFragment,
            minTileRow: minTileRowFragment,
            maxTileCol: minTileColFragment + numTilesPerFragmentSide - 1,
            maxTileRow: minTileRowFragment + numTilesPerFragmentSide - 1,
        };
    }

    private calculateSparseFragmentBounds(
        x: number,
        y: number,
        aggregationCoefficient: number,
        limit: TileMatrixLimits,
    ): TileMatrixLimits {
        const numTilesPerFragmentSide = 2 ** aggregationCoefficient;
        const minTileColFragment = Math.floor(x / numTilesPerFragmentSide) * numTilesPerFragmentSide;
        const minTileRowFragment = Math.floor(y / numTilesPerFragmentSide) * numTilesPerFragmentSide;
        const fragmentBoundsOfSpecifiedTileGlobalTileCrs = {
            minTileCol: minTileColFragment,
            minTileRow: minTileRowFragment,
            maxTileCol: minTileColFragment + numTilesPerFragmentSide - 1,
            maxTileRow: minTileRowFragment + numTilesPerFragmentSide - 1,
        };
        return this.calculateFragmentBounds(limit, fragmentBoundsOfSpecifiedTileGlobalTileCrs);
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

    private numberOfIndexEntriesBeforeFragment(
        sparseFragmentsBounds: TileMatrixLimits,
        limit: TileMatrixLimits,
    ): number {
        /* Calculate the number of tiles which are on the left side of the fragment */
        const leftNumTilesBeforeFragment =
            (sparseFragmentsBounds.minTileCol - limit.minTileCol) *
            (sparseFragmentsBounds.maxTileRow - limit.minTileRow + 1);

        /* Calculate the number of tiles which are below the fragment of the specified tile */
        const lowerNumTilesBeforeFragment =
            (limit.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
            (sparseFragmentsBounds.minTileRow - limit.minTileRow);

        return leftNumTilesBeforeFragment + lowerNumTilesBeforeFragment;
    }

    private calculateNumberOfFragmentsBefore(
        x: number,
        y: number,
        denseFragmentsBounds: TileMatrixLimits,
        aggregationCoefficient: number,
    ) {
        /*
         *  ________________
         * | 2. |  T  |     |
         * |____|_____|_____|
         * |       1.       |
         * |________________|
         * */

        /* 1. */
        const numTilesPerFragmentSide = 2 ** aggregationCoefficient;
        const numFragmentsY = Math.floor((y - denseFragmentsBounds.minTileRow) / numTilesPerFragmentSide);
        const numFragmentsX = Math.round(
            (denseFragmentsBounds.maxTileCol - denseFragmentsBounds.minTileCol) / numTilesPerFragmentSide,
        );
        const numFragmentsActualRow = (numFragmentsX + 1) * (numFragmentsY + 1);

        /* 2. */
        const numFragmentsActualCol = Math.floor((x - denseFragmentsBounds.minTileCol) / numTilesPerFragmentSide);

        return numFragmentsActualRow + numFragmentsActualCol;
    }
}
