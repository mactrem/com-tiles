import { calculateNumTiles, getXyzIndexFromUnfragmentedRowMajorOrder, toBytesLE } from "../src/utils";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";

describe("toBytesLE", () => {
    it("should convert 4 bytes", () => {
        /* 11100 11100101 11011010
         * 28    229      218       */
        const num = 1893850;

        const actualBuffer = toBytesLE(num, 4);

        expect(actualBuffer.length).toBe(4);
        expect(actualBuffer[0]).toBe(218);
        expect(actualBuffer[1]).toBe(229);
        expect(actualBuffer[2]).toBe(28);
        expect(actualBuffer[3]).toBe(0);
    });

    it("should convert 5 bytes", () => {
        /* 1110110 01111001 01000110 11000001
         *  118     121       70       193    */
        const num = 1987659457;

        const actualBuffer = toBytesLE(num);

        expect(actualBuffer.length).toBe(5);
        expect(actualBuffer[0]).toBe(193);
        expect(actualBuffer[1]).toBe(70);
        expect(actualBuffer[2]).toBe(121);
        expect(actualBuffer[3]).toBe(118);
        expect(actualBuffer[4]).toBe(0);
    });
});

const tileMatrixSet: TileMatrix[] = [
    {
        zoom: 0,
        aggregationCoefficient: -1,
        tileMatrixLimits: {
            minTileCol: 0,
            minTileRow: 0,
            maxTileCol: 0,
            maxTileRow: 0,
        },
    },
    {
        zoom: 1,
        aggregationCoefficient: -1,
        tileMatrixLimits: {
            minTileCol: 0,
            minTileRow: 0,
            maxTileCol: 1,
            maxTileRow: 1,
        },
    },
    {
        zoom: 2,
        aggregationCoefficient: -1,
        tileMatrixLimits: {
            minTileCol: 0,
            minTileRow: 0,
            maxTileCol: 3,
            maxTileRow: 3,
        },
    },
    {
        zoom: 3,
        aggregationCoefficient: -1,
        tileMatrixLimits: {
            minTileCol: 2,
            minTileRow: 2,
            maxTileCol: 4,
            maxTileRow: 4,
        },
    },
];

describe("getXyzIndexFromRowMajorOrder", () => {
    it.each`
        index | expectedIndex
        ${0}  | ${{ z: 0, x: 0, y: 0 }}
        ${1}  | ${{ z: 1, x: 0, y: 0 }}
        ${5}  | ${{ z: 2, x: 0, y: 0 }}
        ${24} | ${{ z: 3, x: 0, y: 1 }}
    `("should calculate xyz index for index $index", ({ index, expectedIndex }) => {
        const actualXyzIndex = getXyzIndexFromUnfragmentedRowMajorOrder(index, tileMatrixSet);

        expect(actualXyzIndex.z).toBe(expectedIndex.z);
        expect(actualXyzIndex.x).toBe(expectedIndex.x);
        expect(actualXyzIndex.y).toBe(expectedIndex.y);
    });
});

describe("calculateNumTiles", () => {
    it("should calculate number of tiles for specified TileMatrixSet", () => {
        const numTiles = calculateNumTiles(tileMatrixSet);

        expect(numTiles).toBe(30);
    });
});
