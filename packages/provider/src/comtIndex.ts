import { Metadata } from "@com-tiles/spec";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";

type TileMatrixLimits = TileMatrix["tileMatrixLimits"];

export interface FragmentRange {
    index: number;
    startOffset: number;
    endOffset: number;
}

export default class ComtIndex {
    private static readonly NUM_BYTES_TILE_SIZE = 4;
    private static readonly Supported_TILE_MATRIX_CRS = "WebMercatorQuad";
    private static readonly SUPPORTED_ORDERING = [undefined, "RowMajor"];
    private readonly tileMatrixSet: Metadata["tileMatrixSet"];
    private readonly indexEntryByteLength: number;

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

        const tileOffsetByteLength = this.metadata.tileOffsetBytes ?? 5;
        this.indexEntryByteLength = tileOffsetByteLength + ComtIndex.NUM_BYTES_TILE_SIZE;
    }

    /**
     * Calculates the offset of the index fragment that contains the specified tile.
     */
    getFragmentRangeForTile(zoom: number, x: number, y: number): FragmentRange {
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
                 * 1. Calculate the number of index entries which are on the left side of the fragment
                 * 2. Calculate the number of index entries which are below the the fragment of the specified tile
                 * 3. Calculate the number of index entries in the fragment for the end offset
                 *  ________________
                 * |   |    T|      |
                 * |   |_____|______|
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

                /* Calculate the number of index entries in the fragment for the end offset */
                const numIndexEntriesInFragment =
                    (sparseFragmentsBounds.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
                    (sparseFragmentsBounds.maxTileRow - sparseFragmentsBounds.minTileRow + 1);

                startIndex += numberOfIndexEntriesBeforeFragment;
                endIndex = startIndex + numIndexEntriesInFragment - 1;
            }
        }

        const offset = startIndex * this.indexEntryByteLength;
        const endOffset = (endIndex + 1) * this.indexEntryByteLength;
        return { index: startIndex, startOffset: offset, endOffset };
    }

    /**
     * Calculates the offset within the index (IndexEntry) for the specified tile based on the metadata.
     * This method can be used when the full index is kept in memory.
     * If this is not the case use index fragments to query parts of the index.
     */
    calculateIndexOffsetForTile(zoom: number, x: number, y: number): { offset: number; index: number } {
        const offset = this.tileMatrixSet.tileMatrix
            .filter((tm) => tm.zoom <= zoom)
            .reduce((offset, ts) => {
                const limit = ts.tileMatrixLimits;
                if (ts.zoom === zoom && !this.inRange(x, y, limit)) {
                    throw new Error("Specified tile index not part of the TileSet.");
                }

                if (ts.zoom < zoom) {
                    const numTiles =
                        (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow + 1);
                    return offset + numTiles * this.indexEntryByteLength;
                } else {
                    /*
                     * Calculates the index based on a space filling curve with row-major order with origin on the lower left side
                     * (TMS tiling scheme) like specified in the MBTiles spec
                     * */
                    if (ts.aggregationCoefficient === -1) {
                        const numRows = y - limit.minTileRow;
                        const numCols = limit.maxTileCol - limit.minTileCol + 1;
                        const deltaCol = x - limit.minTileCol;
                        return (
                            offset + (numRows > 0 ? numRows * numCols + deltaCol : deltaCol) * this.indexEntryByteLength
                        );
                    } else {
                        /*
                         * Calculate the number of index entries before the fragment which contains the specified tile
                         * 1. Calculate the number of index entries which are on the left side of the fragment
                         * 2. Calculate the number of index entries which are below the the fragment of the specified tile
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

                        const numIndexEntries = numberOfIndexEntriesBeforeFragment + numTilesFullRows + partialTiles;
                        return offset + numIndexEntries * this.indexEntryByteLength;
                    }
                }
            }, 0);

        const index = offset / this.indexEntryByteLength;
        return { offset, index };
    }

    private inRange(x: number, y: number, tileSetLimits: TileMatrixLimits): boolean {
        return (
            x >= tileSetLimits.minTileCol &&
            x <= tileSetLimits.maxTileCol &&
            y >= tileSetLimits.minTileRow &&
            y <= tileSetLimits.maxTileRow
        );
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
        const fragmentBoundsOfSpecifiedTileGlobalTilCrs = {
            minTileCol: minTileColFragment,
            minTileRow: minTileRowFragment,
            maxTileCol: minTileColFragment + numTilesPerFragmentSide - 1,
            maxTileRow: minTileRowFragment + numTilesPerFragmentSide - 1,
        };
        return this.calculateFragmentBounds(limit, fragmentBoundsOfSpecifiedTileGlobalTilCrs);
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

        /* Calculate the number of tiles which are below the the fragment of the specified tile */
        const lowerNumTilesBeforeFragment =
            (limit.maxTileCol - sparseFragmentsBounds.minTileCol + 1) *
            (sparseFragmentsBounds.minTileRow - limit.minTileRow);

        return leftNumTilesBeforeFragment + lowerNumTilesBeforeFragment;
    }
}
