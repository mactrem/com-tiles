import { TileMatrix } from "@comt/spec/types/tileMatrix";
import IndexFactory from "../src/indexFactory";
import { MBTilesRepository, Tile } from "../src/mbTilesRepository";

function range(to: number) {
    return [...Array.from(Array(to).keys())];
}

Array(10).keys();

describe("createIndexInRowMajorOrder", () => {
    it("should create dense index fragments in row-major order", async () => {
        const numTiles = 4 ** 0 + 4 ** 1 + 4 ** 2;
        const tiles = range(numTiles).map((i) => {
            return { data: new Uint8Array([i]) };
        });
        const tileMatrixSet: TileMatrix[] = [];
        tileMatrixSet.push({
            zoom: 0,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 0,
                maxTileRow: 0,
            },
        });
        tileMatrixSet.push({
            zoom: 1,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 1,
                maxTileRow: 1,
            },
        });
        tileMatrixSet.push({
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 3,
                maxTileRow: 3,
            },
        });
        const tileRepository = await MBTilesRepository.create("");
        //tileRepository.getTilesByRowMajorOrder = jest.fn((z) => (z === 0 ? tiles.splice(0, 1) : tiles.splice(0, 4)));
        tileRepository.getTilesByRowMajorOrder = jest.fn(
            (z) =>
                new Promise((resolve) => {
                    const tileBatch = z === 0 ? tiles.splice(0, 1) : tiles.splice(0, 4);
                    resolve(tileBatch as Tile[]);
                }),
        );

        const index = await IndexFactory.createIndexInRowMajorOrder(tileRepository, tileMatrixSet);

        expect(index).toBeDefined();
        index.forEach((indexEntry, i) => {
            const { size, offset } = index[i];
            expect(size).toBe(1);
            expect(offset).toBe(i);
        });
    });

    it("should create sparse index fragments in row-major order", async () => {
        const numTiles = 4 ** 0 + 4 ** 1 + 4;
        const xyzIndices = [
            { row: 0, column: 0 },
            { row: 0, column: 0 },
            { row: 1, column: 0 },
            { row: 0, column: 1 },
            { row: 1, column: 1 },
            { row: 1, column: 1 },
            { row: 1, column: 2 },
            { row: 2, column: 1 },
            { row: 2, column: 2 },
        ];
        const tiles = range(numTiles).map((i) => {
            return { data: new Uint8Array([i]), ...xyzIndices.shift() };
        });
        const tileMatrixSet: TileMatrix[] = [];
        tileMatrixSet.push({
            zoom: 0,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 0,
                maxTileRow: 0,
            },
        });
        tileMatrixSet.push({
            zoom: 1,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 1,
                maxTileRow: 1,
            },
        });
        tileMatrixSet.push({
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileCol: 1,
                minTileRow: 1,
                maxTileCol: 2,
                maxTileRow: 2,
            },
        });
        const tileRepository = await MBTilesRepository.create("");
        tileRepository.getTilesByRowMajorOrder = jest.fn(
            (z) =>
                new Promise((resolve) => {
                    const tileBatch = z !== 1 ? tiles.splice(0, 1) : tiles.splice(0, 4);
                    resolve(tileBatch as Tile[]);
                }),
        );

        const index = await IndexFactory.createIndexInRowMajorOrder(tileRepository, tileMatrixSet);

        expect(index).toBeDefined();
        index.forEach((indexEntry, i) => {
            const { size, offset } = index[i];
            expect(size).toBe(1);
            expect(offset).toBe(i);
        });
    });
});
