import { Metadata } from "@com-tiles/spec";
import ComtIndex from "../src/comtIndex";

describe("calculateIndexOffsetForTile", () => {
    const metadata: Metadata = {
        name: "test",
        tileFormat: "pbf",
        tileMatrixSet: {
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrix: [],
        },
    };

    it("should return O as index for top level tile", () => {
        metadata.tileMatrixSet.tileMatrix = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0,
                },
            },
        ];
        const comtIndex = new ComtIndex(metadata);

        const { offset, index } = comtIndex.calculateIndexOffsetForTile(0, 0, 0);

        expect(offset).toBe(0);
        expect(index).toBe(0);
    });

    it("should return valid offset for tile 1/1/1 when no aggregationCoefficient is specified", () => {
        metadata.tileMatrixSet.tileMatrix = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0,
                },
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1,
                },
            },
            {
                zoom: 2,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 1,
                    maxTileCol: 1,
                },
            },
        ];
        const comtIndex = new ComtIndex(metadata);

        /*
         * TMS -> x=1, y=0
         * ^
         * | 0 0
         * | 1 1
         * | _ _ >
         * */
        const { offset, index } = comtIndex.calculateIndexOffsetForTile(1, 1, 0);

        const expectIndex = 2;
        expect(offset).toBe(expectIndex * 9);
        expect(index).toBe(expectIndex);
    });

    /*
     * TMS -> x=2, y=3
     * ^
     * | -> 1 -> 1 -> 1 -> 0
     * | -> 1 -> 1 -> 1 -> 1
     * | -> 1 -> 1 -> 1 -> 1
     * |    1 -> 1 -> 1 -> 1
     * | _ _ >
     * */
    it.each`
        tileIndex               | expectedIndex
        ${{ z: 2, x: 2, y: 2 }} | ${1 + 2 + 12}
        ${{ z: 2, x: 2, y: 3 }} | ${1 + 2 + 14}
        ${{ z: 2, x: 3, y: 3 }} | ${1 + 2 + 15}
    `(
        "should return valid offset when a aggregationCoefficient with only dense fragments is specified",
        ({ tileIndex, expectedIndex }) => {
            metadata.tileMatrixSet.tileMatrix = [
                {
                    zoom: 0,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileRow: 0,
                        minTileCol: 0,
                        maxTileRow: 0,
                        maxTileCol: 0,
                    },
                },
                {
                    zoom: 1,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileRow: 0,
                        minTileCol: 0,
                        maxTileRow: 0,
                        maxTileCol: 1,
                    },
                },
                {
                    zoom: 2,
                    aggregationCoefficient: 1,
                    tileMatrixLimits: {
                        minTileRow: 0,
                        minTileCol: 0,
                        maxTileRow: 3,
                        maxTileCol: 3,
                    },
                },
            ];
            const comtIndex = new ComtIndex(metadata);

            const { offset, index } = comtIndex.calculateIndexOffsetForTile(tileIndex.z, tileIndex.x, tileIndex.y);
            expect(index).toBe(expectedIndex);
            expect(offset).toBe(expectedIndex * 9);
        },
    );

    it("should return valid offset when a aggregationCoefficient with sparse fragments is specified", () => {
        metadata.tileMatrixSet.tileMatrix = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0,
                },
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1,
                },
            },
            {
                zoom: 2,
                aggregationCoefficient: 1,
                tileMatrixLimits: {
                    minTileRow: 1,
                    minTileCol: 1,
                    maxTileRow: 2,
                    maxTileCol: 2,
                },
            },
        ];
        const comtIndex = new ComtIndex(metadata);

        /*
         * TMS -> x=2, y=2
         * ^
         * | -> 0 -> 0 -> 0 -> 0
         * | -> 0 -> 1 -> 1 -> 0
         * | -> 0 -> 1 -> 1 -> 0
         * |    0 -> 0 -> 0 -> 0
         * | _ _ >
         * */
        const { offset, index } = comtIndex.calculateIndexOffsetForTile(2, 2, 2);
        const expectedIndex = 1 + 2 + 3;
        expect(index).toBe(expectedIndex);
        expect(offset).toBe(expectedIndex * 9);

        metadata.tileMatrixSet.tileMatrix[2].tileMatrixLimits = {
            minTileRow: 0,
            minTileCol: 1,
            maxTileRow: 3,
            maxTileCol: 2,
        };
        /*
         * TMS -> x=2, y=3
         * ^
         * | -> 0 -> 1 -> 1 -> 0
         * | -> 0 -> 1 -> 1 -> 0
         * | -> 0 -> 1 -> 1 -> 0
         * |    0 -> 1 -> 1 -> 0
         * | _ _ >
         * */
        const { offset: offset2, index: index2 } = comtIndex.calculateIndexOffsetForTile(2, 2, 3);
        const expectedIndex2 = 1 + 2 + 7;
        expect(index2).toBe(expectedIndex2);
        expect(offset2).toBe(expectedIndex2 * 9);

        metadata.tileMatrixSet.tileMatrix[2] = {
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileRow: 0,
                minTileCol: 0,
                maxTileRow: 2,
                maxTileCol: 2,
            },
        };
        metadata.tileMatrixSet.tileMatrix[3] = {
            zoom: 3,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileRow: 1,
                minTileCol: 3,
                maxTileRow: 6,
                maxTileCol: 6,
            },
        };
        const { offset: offset3, index: index3 } = comtIndex.calculateIndexOffsetForTile(3, 5, 5);
        const expectedIndex3 = 1 + 2 + 9 + 17;
        expect(expectedIndex3).toBe(index3);
        expect(offset3).toBe(expectedIndex3 * 9);
    });

    it("should return valid offset when a TileMatrix with sparse and dense fragments until zoom 14 is specified", () => {
        metadata.tileMatrixSet = {
            tileMatrixCRS: "WebMercatorQuad ",
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrix: [
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
                        minTileCol: 1,
                        minTileRow: 1,
                        maxTileCol: 1,
                        maxTileRow: 1,
                    },
                },
                {
                    zoom: 2,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 2,
                        minTileRow: 2,
                        maxTileCol: 2,
                        maxTileRow: 2,
                    },
                },
                {
                    zoom: 3,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 4,
                        minTileRow: 5,
                        maxTileCol: 4,
                        maxTileRow: 5,
                    },
                },
                {
                    zoom: 4,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 8,
                        minTileRow: 10,
                        maxTileCol: 8,
                        maxTileRow: 10,
                    },
                },
                {
                    zoom: 5,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 16,
                        minTileRow: 20,
                        maxTileCol: 17,
                        maxTileRow: 21,
                    },
                },
                {
                    zoom: 6,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 33,
                        minTileRow: 41,
                        maxTileCol: 35,
                        maxTileRow: 42,
                    },
                },
                {
                    zoom: 7,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 67,
                        minTileRow: 82,
                        maxTileCol: 70,
                        maxTileRow: 84,
                    },
                },
                {
                    zoom: 8,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 134,
                        minTileRow: 165,
                        maxTileCol: 140,
                        maxTileRow: 168,
                    },
                },
                {
                    zoom: 9,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 269,
                        minTileRow: 330,
                        maxTileCol: 280,
                        maxTileRow: 336,
                    },
                },
                {
                    zoom: 10,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 539,
                        minTileRow: 661,
                        maxTileCol: 560,
                        maxTileRow: 672,
                    },
                },
                {
                    zoom: 11,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 1078,
                        minTileRow: 1322,
                        maxTileCol: 1121,
                        maxTileRow: 1344,
                    },
                },
                {
                    zoom: 12,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 2156,
                        minTileRow: 2644,
                        maxTileCol: 2243,
                        maxTileRow: 2689,
                    },
                },
                {
                    zoom: 13,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 4312,
                        minTileRow: 5289,
                        maxTileCol: 4486,
                        maxTileRow: 5379,
                    },
                },
                {
                    zoom: 14,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 8625,
                        minTileRow: 10579,
                        maxTileCol: 8973,
                        maxTileRow: 10759,
                    },
                },
            ],
        };
        const expectedIndex = 42790;
        const comtIndex = new ComtIndex(metadata);

        const { offset, index } = comtIndex.calculateIndexOffsetForTile(14, 8705, 10634);

        expect(index).toBe(expectedIndex);
        expect(offset).toBe(expectedIndex * 9);
    });
});

describe("getFragmentRangeForTile", () => {
    const metadata: Metadata = {
        name: "test",
        tileFormat: "pbf",
        tileMatrixSet: {
            tileMatrixCRS: "WebMercatorQuad ",
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrix: [
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
                        minTileCol: 1,
                        minTileRow: 1,
                        maxTileCol: 1,
                        maxTileRow: 1,
                    },
                },
                {
                    zoom: 2,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 2,
                        minTileRow: 2,
                        maxTileCol: 2,
                        maxTileRow: 2,
                    },
                },
                {
                    zoom: 3,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 4,
                        minTileRow: 5,
                        maxTileCol: 4,
                        maxTileRow: 5,
                    },
                },
                {
                    zoom: 4,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 8,
                        minTileRow: 10,
                        maxTileCol: 8,
                        maxTileRow: 10,
                    },
                },
                {
                    zoom: 5,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 16,
                        minTileRow: 20,
                        maxTileCol: 17,
                        maxTileRow: 21,
                    },
                },
                {
                    zoom: 6,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 33,
                        minTileRow: 41,
                        maxTileCol: 34,
                        maxTileRow: 43,
                    },
                },
                {
                    zoom: 7,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 66,
                        minTileRow: 83,
                        maxTileCol: 69,
                        maxTileRow: 87,
                    },
                },
                {
                    zoom: 8,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 132,
                        minTileRow: 166,
                        maxTileCol: 138,
                        maxTileRow: 175,
                    },
                },
                {
                    zoom: 9,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 264,
                        minTileRow: 332,
                        maxTileCol: 277,
                        maxTileRow: 350,
                    },
                },
                {
                    zoom: 10,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 528,
                        minTileRow: 664,
                        maxTileCol: 554,
                        maxTileRow: 700,
                    },
                },
                {
                    zoom: 11,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 1057,
                        minTileRow: 1329,
                        maxTileCol: 1109,
                        maxTileRow: 1401,
                    },
                },
                {
                    zoom: 12,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 2114,
                        minTileRow: 2659,
                        maxTileCol: 2219,
                        maxTileRow: 2803,
                    },
                },
                {
                    zoom: 13,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 4229,
                        minTileRow: 5319,
                        maxTileCol: 4438,
                        maxTileRow: 5606,
                    },
                },
                {
                    zoom: 14,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 8458,
                        minTileRow: 10639,
                        maxTileCol: 8876,
                        maxTileRow: 11213,
                    },
                },
            ],
        },
    };

    it("should return a valid fragmentRange when a TileMatrix with sparse and dense fragments until zoom 14 is specified", () => {
        metadata.tileMatrixSet = {
            tileMatrixCRS: "WebMercatorQuad ",
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrix: [
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
                        minTileCol: 1,
                        minTileRow: 1,
                        maxTileCol: 1,
                        maxTileRow: 1,
                    },
                },
                {
                    zoom: 2,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 2,
                        minTileRow: 2,
                        maxTileCol: 2,
                        maxTileRow: 2,
                    },
                },
                {
                    zoom: 3,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 4,
                        minTileRow: 5,
                        maxTileCol: 4,
                        maxTileRow: 5,
                    },
                },
                {
                    zoom: 4,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 8,
                        minTileRow: 10,
                        maxTileCol: 8,
                        maxTileRow: 10,
                    },
                },
                {
                    zoom: 5,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 16,
                        minTileRow: 20,
                        maxTileCol: 17,
                        maxTileRow: 21,
                    },
                },
                {
                    zoom: 6,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 33,
                        minTileRow: 41,
                        maxTileCol: 34,
                        maxTileRow: 43,
                    },
                },
                {
                    zoom: 7,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 66,
                        minTileRow: 83,
                        maxTileCol: 69,
                        maxTileRow: 87,
                    },
                },
                {
                    zoom: 8,
                    aggregationCoefficient: -1,
                    tileMatrixLimits: {
                        minTileCol: 132,
                        minTileRow: 166,
                        maxTileCol: 138,
                        maxTileRow: 175,
                    },
                },
                {
                    zoom: 9,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 264,
                        minTileRow: 332,
                        maxTileCol: 277,
                        maxTileRow: 350,
                    },
                },
                {
                    zoom: 10,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 528,
                        minTileRow: 664,
                        maxTileCol: 554,
                        maxTileRow: 700,
                    },
                },
                {
                    zoom: 11,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 1057,
                        minTileRow: 1329,
                        maxTileCol: 1109,
                        maxTileRow: 1401,
                    },
                },
                {
                    zoom: 12,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 2114,
                        minTileRow: 2659,
                        maxTileCol: 2219,
                        maxTileRow: 2803,
                    },
                },
                {
                    zoom: 13,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 4229,
                        minTileRow: 5319,
                        maxTileCol: 4438,
                        maxTileRow: 5606,
                    },
                },
                {
                    zoom: 14,
                    aggregationCoefficient: 6,
                    tileMatrixLimits: {
                        minTileCol: 8458,
                        minTileRow: 10639,
                        maxTileCol: 8876,
                        maxTileRow: 11213,
                    },
                },
            ],
        };
        const expectedFragmentRange = { endOffset: 364059, index: 36355, startOffset: 327195 };
        const comtIndex = new ComtIndex(metadata);

        const fragmentRange = comtIndex.getFragmentRangeForTile(13, 4325, 5397);

        expect(fragmentRange).toEqual(expectedFragmentRange);
    });

    it.each`
        tileIndex                      | expectedIndex
        ${{ z: 11, x: 1158, y: 1600 }} | ${309870}
        ${{ z: 11, x: 830, y: 1600 }}  | ${289070}
    `(
        "should calculate valid fragment range for a specific tile in the europe dataset",
        ({ tileIndex, expectedIndex }) => {
            metadata.tileMatrixSet = {
                tileMatrixCRS: "WebMercatorQuad",
                fragmentOrdering: "RowMajor",
                tileOrdering: "RowMajor",
                tileMatrix: [
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
                            minTileRow: 1,
                            maxTileCol: 1,
                            maxTileRow: 1,
                        },
                    },
                    {
                        zoom: 2,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 1,
                            minTileRow: 2,
                            maxTileCol: 2,
                            maxTileRow: 3,
                        },
                    },
                    {
                        zoom: 3,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 3,
                            minTileRow: 4,
                            maxTileCol: 5,
                            maxTileRow: 7,
                        },
                    },
                    {
                        zoom: 4,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 6,
                            minTileRow: 9,
                            maxTileCol: 10,
                            maxTileRow: 14,
                        },
                    },
                    {
                        zoom: 5,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 12,
                            minTileRow: 18,
                            maxTileCol: 20,
                            maxTileRow: 29,
                        },
                    },
                    {
                        zoom: 6,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 25,
                            minTileRow: 37,
                            maxTileCol: 40,
                            maxTileRow: 58,
                        },
                    },
                    {
                        zoom: 7,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileCol: 51,
                            minTileRow: 75,
                            maxTileCol: 80,
                            maxTileRow: 116,
                        },
                    },
                    {
                        zoom: 8,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 103,
                            minTileRow: 150,
                            maxTileCol: 161,
                            maxTileRow: 233,
                        },
                    },
                    {
                        zoom: 9,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 206,
                            minTileRow: 300,
                            maxTileCol: 322,
                            maxTileRow: 467,
                        },
                    },
                    {
                        zoom: 10,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 413,
                            minTileRow: 600,
                            maxTileCol: 644,
                            maxTileRow: 935,
                        },
                    },
                    {
                        zoom: 11,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 827,
                            minTileRow: 1201,
                            maxTileCol: 1289,
                            maxTileRow: 1870,
                        },
                    },
                    {
                        zoom: 12,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 1655,
                            minTileRow: 2402,
                            maxTileCol: 2579,
                            maxTileRow: 3740,
                        },
                    },
                    {
                        zoom: 13,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 3311,
                            minTileRow: 4805,
                            maxTileCol: 5159,
                            maxTileRow: 7481,
                        },
                    },
                    {
                        zoom: 14,
                        aggregationCoefficient: 6,
                        tileMatrixLimits: {
                            minTileCol: 6622,
                            minTileRow: 9610,
                            maxTileCol: 10319,
                            maxTileRow: 14962,
                        },
                    },
                ],
            };
            const comtIndex = new ComtIndex(metadata);

            const actualFragmentRange = comtIndex.getFragmentRangeForTile(tileIndex.z, tileIndex.x, tileIndex.y);
            expect(actualFragmentRange.index).toEqual(expectedIndex);
        },
    );
});
