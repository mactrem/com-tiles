import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileMatrixLimits } from "@com-tiles/spec/types/tileMatrixLimits";
import { MBTilesRepository } from "./mbTilesRepository";

export interface Tile {
    zoom: number;
    column: number;
    row: number;
    data: Uint8Array;
}

export interface TileInfo extends Omit<Tile, "data"> {
    size: number;
}

//TODO: refactor naming
export enum DataContent {
    TILE,
    SIZE,
}

type TileType<T extends DataContent> = T extends DataContent.SIZE
    ? TileInfo
    : T extends DataContent.TILE
    ? Tile
    : never;

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
    async *getTilesInRowMajorOrder<T extends DataContent>(tileType: T): AsyncIterable<TileType<T>> {
        const minZoom = this.tileMatrixSet[0].zoom;
        const maxZoom = this.tileMatrixSet[this.tileMatrixSet.length - 1].zoom;

        const getTiles =
            tileType === DataContent.SIZE
                ? this.repository.getByteLengthOfTilesByRowMajorOrder.bind(this.repository)
                : this.repository.getTilesByRowMajorOrder.bind(this.repository);

        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
            const tileMatrix = this.tileMatrixSet[zoom];
            const limits = tileMatrix.tileMatrixLimits;

            if (!TileProvider.useIndexFragmentation(tileMatrix)) {
                const tiles = await getTiles(zoom, limits);
                for (const tile of tiles) {
                    //TODO: refactor
                    yield { zoom, ...tile } as any;
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
                        const tiles = await getTiles(zoom, sparseFragmentBounds);
                        for (const tile of tiles) {
                            //TODO: refactor
                            yield { zoom, ...tile } as any;
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
}
