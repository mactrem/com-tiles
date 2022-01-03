import {Metadata} from "@com-tiles/spec";
import {calculateIndexOffsetForTile} from "../src/index";

describe("calculateIndexOffsetForTile", () => {
    const metadata: Metadata = {
        name: "test",
        tileFormat: "pbf",
        tileMatrixSet: {
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrixSet: [
            ]
        }
    }

    it("should return O as index for top level tile", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
                    {
                        zoom: 0,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileRow: 0,
                            minTileCol: 0,
                            maxTileRow: 0,
                            maxTileCol: 0
                        }
                    }
                ];

        const index = calculateIndexOffsetForTile(metadata, 0, 0,0);

        expect(index).toBe(0);
    });

    it("should return valid offset for tile 1/1/1 when no aggregationCoefficient is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            }
        ];

        /*
        * TMS -> x=1, y=0
        * ^
        * | 0 0
        * | 1 1
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 1, 1,0);

        expect(index).toBe(2 * 8);
    });

    it("should return valid offset when a aggregationCoefficient with only dense fragments is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            },
            {
                zoom: 2,
                aggregationCoefficient: 1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 2,
                    maxTileCol: 2
                }
            }
        ];

        /*
        * TMS -> x=2, y=3
        * ^
        * | -> 0 -> 0 -> 1 -> 0
        * | -> 1 -> 1 -> 1 -> 1
        * | -> 1 -> 1 -> 1 -> 1
        * |    1 -> 1 -> 1 -> 1
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 2, 2,3);

        expect(index).toBe((1 + 2 + 14) * 8);
    });

    it("should return valid offset when a aggregationCoefficient with sparse fragments is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            },
            {
                zoom: 2,
                aggregationCoefficient: 1,
                tileMatrixLimits: {
                    minTileRow: 1,
                    minTileCol: 1,
                    maxTileRow: 2,
                    maxTileCol: 2
                }
            }
        ];

        /*
        * TMS -> x=2, y=2
        * ^
        * | -> 0 -> 0 -> 0 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * |    0 -> 0 -> 0 -> 0
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 2, 2,2);
        expect(index).toBe((1 + 2 + 3) * 8);


        metadata.tileMatrixSet.tileMatrixSet[2].tileMatrixLimits = {
            minTileRow: 0,
            minTileCol: 1,
            maxTileRow: 3,
            maxTileCol: 2
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
        const index2 = calculateIndexOffsetForTile(metadata, 2, 2,3);
        expect(index2).toBe((1 + 2 + 7) * 8);
    });

    /*it("should return O as index for first tile in zoom level 2", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds, 2, 0,0);

        expect(index).toBe(5);
    });

    it("should return 5 as index for tile 1,1,1", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,1, 1,1);

        expect(index).toBe(4);
    });

    it("should return 1 as index for tile 1,1,1 with bounds within tile 1,1,0", () => {
        const bounds = [50,-60,120,-20];

        const index = calculateRangeIndex(bounds,1, 1,0);

        expect(index).toBe(1);
    });

    it("should return 1 as index for tile 1,1,1 with bounds within tile 2,1,0", () => {
        const bounds = [50,-60,120,-20];

        //const index = calculateRangeIndex(bounds,2, 6,2);
        const index = calculateRangeIndex(bounds,2, 2,1);

        expect(index).toBe(3);
    });

    it("should return 3 as index for tile 1,0,1", () => {
        //TODO: use mercator bounds as bbbox?
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,1, 0,1);

        expect(index).toBe(3);
    });

    it("should return 47 as index for tile 3,2,3", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,3, 2,3);

        expect(index).toBe(47);
    });*/

});
