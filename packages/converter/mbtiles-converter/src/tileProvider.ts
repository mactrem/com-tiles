import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileMatrixLimits } from "@com-tiles/spec/types/tileMatrixLimits";
import { MBTilesRepository, Tile } from "./mbTilesRepository";

export default class TileProvider {
    /**
     *
     * @param repository Repository for accessing the tiles
     * @param tileMatrixSet Describes the bounds of the tileset
     */
    constructor(private readonly repository: MBTilesRepository, private readonly _tileMatrixSet: TileMatrix[]) {}

    get tileMatrixSet(): TileMatrix[] {
        return this._tileMatrixSet;
    }

    /**
     *
     * @returns Collection of map tiles where tiles are arranged in row-major order
     */
    async *getTilesInRowMajorOrder(): AsyncIterable<Uint8Array> {
        const minZoom = this.tileMatrixSet[0].zoom;
        const maxZoom = this.tileMatrixSet[this.tileMatrixSet.length - 1].zoom;
        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
            const tileMatrix = this.tileMatrixSet[zoom];
            const limits = tileMatrix.tileMatrixLimits;

            if (!TileProvider.useIndexFragmentation(tileMatrix)) {
                const tiles = await this.repository.getTilesByRowMajorOrder(zoom, limits);
                const paddedTiles = TileProvider.hasMissingTiles(limits, tiles)
                    ? TileProvider.addMissingTiles(limits, tiles)
                    : tiles;
                for (const { data } of paddedTiles) {
                    yield data;
                }
            } else {
                /* use index fragments and sparse fragments */
                const numIndexEntriesPerFragmentSide = 2 ** tileMatrix.aggregationCoefficient;
                // eslint-disable-next-line prefer-const
                let { fragmentMinColIndex, numFragmentsCol, numFragmentsRow, denseFragmentBounds } =
                    TileProvider.calculateDenseFragmentBounds(limits, numIndexEntriesPerFragmentSide);

                for (let fragmentRow = 0; fragmentRow < numFragmentsRow; fragmentRow++) {
                    for (let fragmentCol = 0; fragmentCol < numFragmentsCol; fragmentCol++) {
                        const sparseFragmentBounds = TileProvider.calculateSparseFragmentBounds(
                            limits,
                            denseFragmentBounds,
                        );
                        const tiles = await this.repository.getTilesByRowMajorOrder(zoom, sparseFragmentBounds);
                        const paddedTiles = TileProvider.hasMissingTiles(sparseFragmentBounds, tiles)
                            ? TileProvider.addMissingTiles(sparseFragmentBounds, tiles)
                            : tiles;
                        for (const { data } of paddedTiles) {
                            yield data;
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

    private static addMissingTiles(limit: TileMatrixLimits, tiles: Tile[]): Tile[] {
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
