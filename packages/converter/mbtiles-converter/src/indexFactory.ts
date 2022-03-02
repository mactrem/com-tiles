import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileMatrixLimits } from "@com-tiles/spec/types/tileMatrixLimits";
import { MBTilesRepository, Tile } from "./mbTilesRepository";

/* 5 bytes offset and 4 bytes size as default */
export interface IndexEntry {
    offset: number;
    size: number;
    zoom: number;
    row: number;
    column: number;
}

export default class IndexFactory {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     *
     * Create an index where the fragments and the index entries of a fragment are arranged in row-major order.
     *
     * @param tileRepository Repository for accessing the tiles
     * @param tileMatrixSet Describes the bounds of the tileset
     * @returns Collection of {@link IndexEntry}
     */
    static async createIndexInRowMajorOrder(
        tileRepository: MBTilesRepository,
        tileMatrixSet: TileMatrix[],
    ): Promise<IndexEntry[]> {
        const index: IndexEntry[] = [];
        const minZoom = tileMatrixSet[0].zoom;
        const maxZoom = tileMatrixSet[tileMatrixSet.length - 1].zoom;

        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
            const tileMatrix = tileMatrixSet[zoom];
            const limits = tileMatrix.tileMatrixLimits;

            if (!IndexFactory.useIndexFragmentation(tileMatrix)) {
                /* reference to the current tile in the array */
                const tileIndex = index.length - 1;
                /* reference to the current tile in the final blob */
                let offset = index.length ? index[tileIndex].offset + index[tileIndex].size : 0;

                const tiles = await tileRepository.getTilesByRowMajorOrder(zoom);
                const paddedTiles = IndexFactory.hasMissingTiles(limits, tiles)
                    ? this.addMissingTiles(limits, tiles)
                    : tiles;
                for (const { data, row, column } of paddedTiles) {
                    const size = data.length;
                    index.push({ offset, size, zoom, row, column });
                    offset += size;
                }
            } else {
                /* use index fragments and sparse fragments */
                const numIndexEntriesPerFragmentSide = 2 ** tileMatrix.aggregationCoefficient;
                // eslint-disable-next-line prefer-const
                let { fragmentMinColIndex, numFragmentsCol, numFragmentsRow, denseFragmentBounds } =
                    IndexFactory.calculateDenseFragmentBounds(limits, numIndexEntriesPerFragmentSide);

                for (let fragmentRow = 0; fragmentRow < numFragmentsRow; fragmentRow++) {
                    for (let fragmentCol = 0; fragmentCol < numFragmentsCol; fragmentCol++) {
                        const sparseFragmentBounds = IndexFactory.calculateSparseFragmentBounds(
                            limits,
                            denseFragmentBounds,
                        );
                        const tiles = await tileRepository.getTilesByRowMajorOrder(zoom, sparseFragmentBounds);
                        const paddedTiles = IndexFactory.hasMissingTiles(sparseFragmentBounds, tiles)
                            ? IndexFactory.addMissingTiles(sparseFragmentBounds, tiles)
                            : tiles;

                        for (const { column, row, data } of paddedTiles) {
                            const size = data.length;
                            const tileIndex = index.length - 1;
                            const offset = index.length ? index[tileIndex].offset + index[tileIndex].size : 0;
                            index.push({ offset, size, zoom, row, column });
                        }

                        /* increment column and keep row */
                        Object.assign(denseFragmentBounds, {
                            minTileCol: denseFragmentBounds.maxTileCol + 1,
                            maxTileCol: denseFragmentBounds.maxTileCol + numIndexEntriesPerFragmentSide,
                        });
                    }

                    /* reset column and increment row */
                    denseFragmentBounds = {
                        minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
                        minTileRow: denseFragmentBounds.maxTileRow + 1,
                        maxTileCol: (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
                        maxTileRow: denseFragmentBounds.maxTileRow + numIndexEntriesPerFragmentSide,
                    };
                }
            }
        }

        return index;
    }

    private static calculateDenseFragmentBounds(limits: TileMatrixLimits, numIndexEntriesPerFragmentSide: number) {
        const fragmentMinColIndex = Math.floor(limits.minTileCol / numIndexEntriesPerFragmentSide);
        const fragmentMinRowIndex = Math.floor(limits.minTileRow / numIndexEntriesPerFragmentSide);
        const fragmentMaxColIndex = Math.floor(limits.maxTileCol / numIndexEntriesPerFragmentSide);
        const fragmentMaxRowIndex = Math.floor(limits.maxTileRow / numIndexEntriesPerFragmentSide);
        const numFragmentsCol = fragmentMaxColIndex - fragmentMinColIndex + 1;
        const numFragmentsRow = fragmentMaxRowIndex - fragmentMinRowIndex + 1;

        const denseFragmentBounds = {
            minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
            minTileRow: fragmentMinRowIndex * numIndexEntriesPerFragmentSide,
            maxTileCol: (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
            maxTileRow: (fragmentMinRowIndex + 1) * numIndexEntriesPerFragmentSide - 1,
        };

        return { fragmentMinColIndex, numFragmentsCol, numFragmentsRow, denseFragmentBounds };
    }

    private static calculateSparseFragmentBounds(
        tileSetLimits: TileMatrixLimits,
        denseFragmentLimits: TileMatrixLimits,
    ): TileMatrixLimits {
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

    private static useIndexFragmentation(tileMatrix: TileMatrix): boolean {
        return tileMatrix.aggregationCoefficient !== -1;
    }

    private static hasMissingTiles(limit: TileMatrixLimits, tiles: Tile[]): boolean {
        const expectedNumTiles = (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow + 1);
        const actualNumTiles = tiles.length;
        return expectedNumTiles !== actualNumTiles;
    }

    private static addMissingTiles(limit: TileMatrixLimits, tiles: Tile[]) {
        const paddedTiles: Tile[] = [];

        for (let row = limit.minTileRow; row <= limit.maxTileRow; row++) {
            for (let col = limit.minTileCol; col <= limit.maxTileCol; col++) {
                if (!tiles.some((tile) => tile.row === row && tile.column === col)) {
                    const emptyTile = new Uint8Array();
                    paddedTiles.push({ column: col, row, data: emptyTile });
                } else {
                    paddedTiles.push(tiles.shift());
                }
            }
        }

        return paddedTiles;
    }
}
